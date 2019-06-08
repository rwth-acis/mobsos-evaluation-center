import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {RawEditComponent} from './raw-edit.component';
import {MatSelectModule, MatSnackBarModule, MatTabsModule} from '@angular/material';
import {TranslateLoader, TranslateModule} from '@ngx-translate/core';
import {createTranslateLoader} from '../app.module';
import {MonacoEditorModule} from 'ngx-monaco-editor';
import {FormsModule} from '@angular/forms';
import {LoggerModule, NgxLoggerLevel} from 'ngx-logger';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {HttpClientTestingModule} from '@angular/common/http/testing';

describe('RawEditComponent', () => {
  let component: RawEditComponent;
  let fixture: ComponentFixture<RawEditComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [RawEditComponent],
      imports: [
        MatTabsModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useFactory: (createTranslateLoader)
          }
        }),
        MonacoEditorModule.forRoot(),
        FormsModule,
        MatSelectModule,
        LoggerModule.forRoot({
          level: NgxLoggerLevel.TRACE,
          serverLogLevel: NgxLoggerLevel.OFF
        }),
        MatSnackBarModule,
        BrowserAnimationsModule,
        HttpClientTestingModule,
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RawEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
