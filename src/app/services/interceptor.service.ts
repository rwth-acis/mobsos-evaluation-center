import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpInterceptor,
  HttpHandler,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';

import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { decrementLoading, incrementLoading } from './store.actions';

/** Pass untouched request through to the next request handler. */
@Injectable({
  providedIn: 'root',
})
export class Interceptor implements HttpInterceptor {
  constructor(public ngrxStore: Store) {}
  requestMap: object = {};

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    if (req.method === 'GET') {
      if (req.url in this.requestMap) {
        return this.requestMap[req.url];
      } else {
        this.ngrxStore.dispatch(incrementLoading());
        const observableResponse = next.handle(req).pipe(
          tap(
            (res) => {
              if (res instanceof HttpResponse) {
                if (res.status >= 200 && res.status < 400) {
                  delete this.requestMap[req.url];
                } else {
                  console.error('error response', res);
                }
                this.ngrxStore.dispatch(decrementLoading());
              }
            },
            (err) => this.handleError(err, req, next)
          ),
          catchError((err) => this.handleError(err, req, next))
        );
        this.requestMap[req.url] = observableResponse;
        return observableResponse;
      }
    } else {
      this.ngrxStore.dispatch(incrementLoading());
      return next.handle(req).pipe(
        tap(
          (res) => {
            if (res instanceof HttpResponse) {
              this.ngrxStore.dispatch(decrementLoading());
            }
          },
          (err) => this.handleError(err, req, next)
        ),
        catchError((err) => this.handleError(err, req, next))
      );
    }
  }

  /**
   * retry making the request. Request should be retried only once or twice
   * @param err
   * @returns
   */
  handleError(
    err,
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    console.error(err.message);
    this.ngrxStore.dispatch(decrementLoading());
    delete this.requestMap[req.url];
    if (err.status === 504) {
      // exception during Rmi invocation
      return next.handle(req);
    }

    return of(undefined);
  }
}
