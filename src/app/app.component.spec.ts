import {async, TestBed} from '@angular/core/testing';
import {RouterTestingModule} from '@angular/router/testing';
import {AppComponent} from './app.component';
import {
  MatButtonModule,
  MatFormFieldModule,
  MatIconModule,
  MatListModule, MatSelectModule,
  MatSidenavModule,
  MatSlideToggleModule, MatSnackBarModule
} from '@angular/material';
import {TranslateLoader, TranslateModule} from '@ngx-translate/core';
import {LoggerModule, NgxLoggerLevel} from 'ngx-logger';
import {createTranslateLoader} from './app.module';
import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {ServiceWorkerModule} from '@angular/service-worker';

describe('AppComponent', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        BrowserAnimationsModule,
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
        MatSidenavModule,
        MatIconModule,
        MatListModule,
        MatButtonModule,
        MatSlideToggleModule,
        MatFormFieldModule,
        MatSelectModule,
        MatSnackBarModule,
        HttpClientTestingModule,
        ServiceWorkerModule.register('', {enabled: false}),
      ],
      declarations: [
        AppComponent
      ],
      schemas: [
        CUSTOM_ELEMENTS_SCHEMA
      ],
    }).compileComponents();
  }));

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title 'mobsos-evaluation-center'`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app.title).toEqual('MobSOS Evaluation Center');
  });

  it('should render title in a h2 tag', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.debugElement.nativeElement;
    expect(compiled.querySelector('las2peer-frontend-statusbar h2').textContent).toContain('MobSOS Evaluation Center');
  });
});
