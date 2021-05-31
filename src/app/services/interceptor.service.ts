import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpInterceptor,
  HttpHandler,
  HttpRequest,
  HttpResponse,
  HttpErrorResponse,
  HttpUserEvent,
} from '@angular/common/http';

import { BehaviorSubject, EMPTY, Observable, of, throwError } from 'rxjs';
import {
  catchError,
  filter,
  share,
  shareReplay,
  tap,
  timeout,
  timeoutWith,
} from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { decrementLoading, incrementLoading } from './store.actions';
import { delayedRetry } from './retryOperator';

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
      return of(null);
    }
    if (req.method === 'GET' && req.url in this.cachedRequests) {
      // a request is already being made to this url
      this.cachedRequests[req.url].subscribe((err) => {
        if (err.status !== 200) {
          console.log(err.status);
        }
      });
      return this.cachedRequests[req.url]; //return an observable of the initial request instead of making a new call
    } else {
      this.ngrxStore.dispatch(incrementLoading());
      //make a new request, handle any errors
      let observableRequest = next.handle(req).pipe(
        filter(
          (res) =>
            res instanceof HttpErrorResponse || res instanceof HttpResponse
        ),
        timeoutWith(300000, throwError("Timeout")),
        tap((res) => {
          if (res instanceof HttpResponse) {
            this.handleResponse(res, req);
          }
        }),
        catchError((err) => {
          this.ngrxStore.dispatch(decrementLoading());

          setTimeout(() => {
            delete this.cachedRequests[req.url];
          }, 30000);
          if (err.status >= 500) {
            this.unreachableServices[req.url] = true;
          }
          return throwError(err);
        }),
        shareReplay(1) // need to use shareReplay to prevent observable from terminating
      );
      if (req.method === 'GET') {
        this.cachedRequests[req.url] = observableRequest; // put the observable request into the request map so further requests can subscribe to it
        this.cachedRequests[req.url].subscribe();
      }
      return observableRequest;
    }
  }

  handleResponse(res: HttpResponse<any>, req: HttpRequest<any>) {
    this.ngrxStore.dispatch(decrementLoading());
    setTimeout(() => {
      delete this.cachedRequests[req.url];
    }, 30000);
  }
}
