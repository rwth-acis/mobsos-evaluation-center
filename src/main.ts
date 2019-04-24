import '@webcomponents/webcomponentsjs/webcomponents-loader.js';
import '@webcomponents/webcomponentsjs/custom-elements-es5-adapter.js';
import 'hammerjs';
import {enableProdMode} from '@angular/core';
import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';

import {AppModule} from './app/app.module';
import {environment} from './environments/environment';

declare global {
  interface Window {
    WebComponents: {
      ready: boolean;
    };
  }
}

if (environment.production) {
  enableProdMode();
}

if (window.WebComponents.ready) {
  // Web Components are ready
  platformBrowserDynamic().bootstrapModule(AppModule)
    .catch(err => console.error(err));
} else {
  // Wait for polyfills to load
  window.addEventListener('WebComponentsReady', () => {
    platformBrowserDynamic().bootstrapModule(AppModule)
      .catch(err => console.error(err));
  });
}
