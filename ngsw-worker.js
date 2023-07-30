// ngsw-worker.js

// Helper function to create a cache key from the request
function getCacheKey(request) {
  return request.url + JSON.stringify(request.clone().json());
}

// Listen for fetch events in the service worker
self.addEventListener('fetch', (event) => {
  // Check if it's a POST request to the desired URL
  if (
    event.request.method === 'POST' &&
    event.request.url.includes('/QVS/query/visualize')
  ) {
    // Try to find the response in the cache
    event.respondWith(
      caches.open('custom-post-cache').then((cache) => {
        return cache
          .match(getCacheKey(event.request))
          .then((response) => {
            // If response found in cache
            if (response) {
              // Check if the cached response has expired (older than 12 hours)
              const cacheExpiration = 12 * 60 * 60 * 1000; // 12 hours in milliseconds
              const cacheCreatedTime = new Date(
                response.headers.get('sw-cache-time'),
              );
              const currentTime = new Date();

              if (currentTime - cacheCreatedTime > cacheExpiration) {
                // If the cached response has expired, remove it from the cache
                cache.delete(getCacheKey(event.request));
              } else {
                // If the cached response is still valid, return it
                return response;
              }
            }

            // If response not found in cache or has expired, fetch, cache, and return
            return fetch(event.request).then((fetchResponse) => {
              const responseToCache = fetchResponse.clone();
              responseToCache.headers.append(
                'sw-cache-time',
                new Date().toString(),
              );
              cache.put(getCacheKey(event.request), responseToCache);
              return fetchResponse;
            });
          });
      }),
    );
  }
  // For other requests, use default caching strategy
  // (e.g., the caching strategy defined in ngsw-config.json)
  event.respondWith(fetch(event.request));
});
