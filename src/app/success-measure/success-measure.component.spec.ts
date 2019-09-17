import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {SuccessMeasureComponent} from './success-measure.component';
import {LoggerModule, NgxLoggerLevel} from 'ngx-logger';
import {MatDialogModule} from '@angular/material';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {MatIconModule} from '@angular/material/icon';
import {TranslateLoader, TranslateModule} from '@ngx-translate/core';
import {createTranslateLoader} from '../app.module';

describe('SuccessMeasureComponent', () => {
  let component: SuccessMeasureComponent;
  let fixture: ComponentFixture<SuccessMeasureComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SuccessMeasureComponent],
      imports: [
        LoggerModule.forRoot({
          level: NgxLoggerLevel.TRACE,
          serverLogLevel: NgxLoggerLevel.OFF
        }),
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useFactory: (createTranslateLoader)
          },
        }),
        MatDialogModule,
        MatIconModule,
        HttpClientTestingModule,
      ],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SuccessMeasureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
