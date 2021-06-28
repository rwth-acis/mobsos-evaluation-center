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
import { createTranslateLoader } from '../app.module';
import { MonacoEditorModule } from 'ngx-monaco-editor';
import { FormsModule } from '@angular/forms';
import { LoggerModule, NgxLoggerLevel } from 'ngx-logger';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { AppState, INITIAL_APP_STATE } from '../models/state.model';
import { StateEffects } from '../services/store.effects';
import { Observable } from 'rxjs';
import { provideMockActions } from '@ngrx/effects/testing';
import { _COMMUNITY_WORKSPACE } from '../services/store.selectors';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

describe('RawEditComponent', () => {
  let component: RawEditComponent;
  let fixture: ComponentFixture<RawEditComponent>;
  const initialState = INITIAL_APP_STATE;
  // tslint:disable-next-line: prefer-const
  let actions$: Observable<any>;
  let store: MockStore<AppState>;
  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [RawEditComponent],
        imports: [
          MatTabsModule,
          TranslateModule.forRoot({
            loader: {
              provide: TranslateLoader,
              useFactory: createTranslateLoader,
            },
          }),
          MonacoEditorModule.forRoot(),
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
    }),
  );

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
