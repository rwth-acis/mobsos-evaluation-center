import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpInterceptor,
  HttpHandler,
  HttpRequest,
  HttpResponse,
  HttpErrorResponse,
} from '@angular/common/http';

import { Observable, of, throwError } from 'rxjs';
import {
  catchError,
  filter,
  shareReplay,
  tap,
  timeoutWith,
} from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { decrementLoading, incrementLoading } from './store.actions';
const ONE_MINUTE_IN_MS = 60000;
interface RequestCache {
  [key: string]: Observable<HttpEvent<any>>;
}
@Injectable({
  providedIn: 'root',
})
export class Interceptor implements HttpInterceptor {
  cachedRequests: RequestCache = {};
  unreachableServices = {};
  constructor(public ngrxStore: Store) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler,
  ): Observable<HttpEvent<any>> {
    if (req.url in this.unreachableServices) {
      return of(null);
    }
    if (req.method === 'GET' && req.url in this.cachedRequests) {
      // a request is already being made to this url
      // this.cachedRequests[req.url].subscribe(() => {});
      return this.cachedRequests[req.url]; // return an observable of the initial request instead of making a new call
    } else {
      this.ngrxStore.dispatch(incrementLoading());
      // make a new request, handle any errors
      const observableRequest = next.handle(req).pipe(
        filter(
          (res) =>
            res instanceof HttpErrorResponse ||
            res instanceof HttpResponse,
        ),
        timeoutWith(ONE_MINUTE_IN_MS, throwError('Timeout')),
        tap((res) => {
          if (res instanceof HttpResponse) {
            this.handleResponse(res, req);
          } else {
            throw new HttpErrorResponse({ error: res });
          }
        }),
        catchError((err) => {
          this.ngrxStore.dispatch(decrementLoading());

          delete this.cachedRequests[req.url];

          if (err.status >= 500) {
            this.unreachableServices[req.url] = true;
          }
          return throwError(err);
        }),
        shareReplay(1), // need to use shareReplay to prevent observable from terminating
      );
      if (req.method === 'GET') {
        this.cachedRequests[req.url] = observableRequest;
        // put the observable request into the request map so further requests can subscribe to it
        this.cachedRequests[req.url].subscribe(() => {});
      }
      return observableRequest;
    }
  }

  handleResponse(res: HttpResponse<any>, req: HttpRequest<any>) {
    this.ngrxStore.dispatch(decrementLoading());
    setTimeout(() => {
      delete this.cachedRequests[req.url];
    }, 2 * ONE_MINUTE_IN_MS);
  }
}
