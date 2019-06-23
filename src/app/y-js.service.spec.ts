import {TestBed} from '@angular/core/testing';

import {YJsService} from './y-js.service';
import {LoggerModule, NgxLoggerLevel} from 'ngx-logger';

describe('YJsService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [
      LoggerModule.forRoot({
        level: NgxLoggerLevel.TRACE,
        serverLogLevel: NgxLoggerLevel.OFF
      })
    ]
  }));

  it('should be created', () => {
    const service: YJsService = TestBed.get(YJsService);
    expect(service).toBeTruthy();
  });
});
