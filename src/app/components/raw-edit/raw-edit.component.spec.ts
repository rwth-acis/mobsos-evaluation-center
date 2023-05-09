import {
  async,
  ComponentFixture,
  TestBed,
  waitForAsync,
} from '@angular/core/testing';

import { RawEditComponent } from './raw-edit.component';

import {
  TranslateLoader,
  TranslateModule,
} from '@ngx-translate/core';


import { FormsModule } from '@angular/forms';
import { LoggerModule, NgxLoggerLevel } from 'ngx-logger';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatLegacyTabsModule as MatTabsModule } from '@angular/material/legacy-tabs';
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select';
import { MatLegacySnackBarModule as MatSnackBarModule } from '@angular/material/legacy-snack-bar';
import { MockStore, provideMockStore } from '@ngrx/store/testing';

import { Observable } from 'rxjs';
import { provideMockActions } from '@ngrx/effects/testing';

import { MatLegacyProgressSpinnerModule as MatProgressSpinnerModule } from '@angular/material/legacy-progress-spinner';
import {
  AppState,
  INITIAL_APP_STATE,
} from 'src/app/models/state.model';
import { createTranslateLoader } from 'src/app/app.module';
import { StateEffects } from 'src/app/services/store/store.effects';
import { RouterTestingModule } from '@angular/router/testing';
import { MonacoEditorModule } from '@materia-ui/ngx-monaco-editor';

describe('RawEditComponent', () => {
  let component: RawEditComponent;
  let fixture: ComponentFixture<RawEditComponent>;
  const initialState = INITIAL_APP_STATE;
  // eslint-disable-next-line prefer-const
  let actions$: Observable<any>;
  let store: MockStore<AppState>;
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [RawEditComponent],
      imports: [
        MatTabsModule,
        RouterTestingModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useFactory: createTranslateLoader,
          },
        }),
        MonacoEditorModule,
        FormsModule,
        MatProgressSpinnerModule,
        MatSelectModule,
        LoggerModule.forRoot({
          level: NgxLoggerLevel.TRACE,
          serverLogLevel: NgxLoggerLevel.OFF,
        }),
        MatSnackBarModule,
        BrowserAnimationsModule,
        HttpClientTestingModule,
      ],
      providers: [
        provideMockStore({ initialState }),
        StateEffects,
        provideMockActions(() => actions$),
      ],
    }).compileComponents();
    store = TestBed.inject(MockStore);
  }));

  beforeEach(() => {
    // store = TestBed.inject(MockStore);
    fixture = TestBed.createComponent(RawEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
