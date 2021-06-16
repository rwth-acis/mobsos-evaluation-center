import { HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { delay, mergeMap, retryWhen } from 'rxjs/operators';

const getErrorMessage = (maxRetry: number) =>
  `XHR failed ${maxRetry} times without success. Giving up.`;
const DEFAULT_MAX_RETRIES = 5;
const DEFAULT_BACKOFF = 700;

/**
 * Operator which tries to make a new request for a specified number of times each time with a greater backoff
 *  taken from  https://medium.com/angular-in-depth/retry-failed-http-requests-in-angular-f5959d486294
 * @param delayMs the initial delay between each call
 * @param maxRetry the maximum number of retries
 * @param backoffMs parameter to increase backoff
 * @returns response or error if maxretry is reached
 */
export function delayedRetry(
  delayMs: number,
  maxRetry = DEFAULT_MAX_RETRIES,
  backoffMs = DEFAULT_BACKOFF,
) {
  let retries = maxRetry;

  return (src: Observable<any>) =>
    src.pipe(
      retryWhen((errors: Observable<any>) =>
        errors.pipe(
          delay(delayMs),
          mergeMap((error: HttpErrorResponse) => {
            if (retries-- > 0) {
              const backofftime =
                delayMs + (maxRetry - retries) * backoffMs;
              return of(error).pipe(delay(backofftime));
            }

            return of(getErrorMessage(maxRetry));
          }),
        ),
      ),
    );
}
