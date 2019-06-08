import {TestBed} from '@angular/core/testing';

import {StoreService} from './store.service';
import {LoggerModule, NgxLoggerLevel} from 'ngx-logger';
import {HttpClientTestingModule} from '@angular/common/http/testing';

describe('StoreService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [
      LoggerModule.forRoot({
        level: NgxLoggerLevel.TRACE,
        serverLogLevel: NgxLoggerLevel.OFF
      }),
      HttpClientTestingModule,
    ]
  }));

  it('should be created', () => {
    const service: StoreService = TestBed.get(StoreService);
    expect(service).toBeTruthy();
  });
});
