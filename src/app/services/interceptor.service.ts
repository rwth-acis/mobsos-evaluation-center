import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpInterceptor,
  HttpHandler,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';

import { EMPTY, Observable, of } from 'rxjs';
import { catchError, share, shareReplay, tap } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { decrementLoading, incrementLoading } from './store.actions';

/** Pass untouched request through to the next request handler. */
@Injectable({
  providedIn: 'root',
})
export class Interceptor implements HttpInterceptor {
  constructor(public ngrxStore: Store) {}
  cachedRequests: object = {};
  unreachableServices = {};

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    if (req.url in this.unreachableServices) {
      return of(undefined);
    }
    if (req.method === 'GET' && this.cachedRequests[req.url]) {
      // a request is already being made to this url
      return this.cachedRequests[req.url]; //return an observable of the initial request instead of making a new call
    } else {
      this.ngrxStore.dispatch(incrementLoading());
      //make a new request, handle any errors
      const observableRequest = next.handle(req).pipe(
        // delayedRetry(200, 3, 100),
        tap(
          (res) => {
            if (res instanceof HttpResponse) {
              this.handleResponse(res, req);
            }
          },
          (err) => {
            if (err.status == 404 || err.status >= 500) {
              this.unreachableServices[req.url] = true;
            }
            throw err;
          }
        ),

        catchError((err) => {
          this.ngrxStore.dispatch(decrementLoading());

          if (err.status == 404 || err.status >= 500) {
            this.unreachableServices[req.url] = true;
          }
          throw err;
        }),
        shareReplay(1), // need to use shareReplay to prevent observable from terminating
        share()
      );
      if (req.method === 'GET') {
        this.cachedRequests[req.url] = observableRequest; //put the observable request into the request map so further requests can subscribe to it
      }
      return observableRequest;
    }
  }

  handleResponse(res: HttpResponse<any>, req: HttpRequest<any>) {
    this.ngrxStore.dispatch(decrementLoading());
    // this.cachedResponses[req.url] = res;

    delete this.cachedRequests[req.url];
  }
}
