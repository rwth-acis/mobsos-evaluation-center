import {TestBed} from '@angular/core/testing';

import {LanguageService} from './language.service';
import {LoggerModule, NgxLoggerLevel} from 'ngx-logger';
import {TranslateLoader, TranslateModule} from '@ngx-translate/core';
import {createTranslateLoader} from './app.module';
import {HttpClientTestingModule} from '@angular/common/http/testing';

describe('LanguageService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useFactory: (createTranslateLoader)
        }
      }),
      LoggerModule.forRoot({
        level: NgxLoggerLevel.TRACE,
        serverLogLevel: NgxLoggerLevel.OFF
      }),
      HttpClientTestingModule,
    ]
  }));

  it('should be created', () => {
    const service: LanguageService = TestBed.get(LanguageService);
    expect(service).toBeTruthy();
  });
});
