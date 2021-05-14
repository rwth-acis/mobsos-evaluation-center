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

/** Pass untouched request through to the next request handler. */
@Injectable()
export class Interceptor implements HttpInterceptor {
  requestMap: object;
  numberOfCurrentCalls = 0;
  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    if (req.method === 'GET' && req.url in this.requestMap) {
      return of(this.requestMap[req.url]);
    } else {
      this.numberOfCurrentCalls++;
      return next.handle(req).pipe(
        tap((res) => {
          if (res instanceof HttpResponse) {
            if (res.status >= 200 && res.status < 400) {
              delete this.requestMap[req.url];
              this.numberOfCurrentCalls--;
            } else {
              console.error('error response', res);
            }
          }
        }),
        catchError((err) => this.handleError(err))
      );
    }
  }

  /**
   * retry making the request. Request should be retried only once or twice
   * @param err
   * @returns
   */
  handleError(err): Observable<HttpEvent<any>> {
    return of(undefined);
  }
}
