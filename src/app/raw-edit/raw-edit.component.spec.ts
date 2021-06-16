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
import { provideMockStore } from '@ngrx/store/testing';
import { INITIAL_APP_STATE } from '../models/state.model';
import { StateEffects } from '../services/store.effects';

describe('RawEditComponent', () => {
  let component: RawEditComponent;
  let fixture: ComponentFixture<RawEditComponent>;
  const initialState = INITIAL_APP_STATE;
  let actions$: Observable<any>;
  let effects: StateEffects;
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
    }),
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(RawEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
function provideMockActions(arg0: () => any): any {
  throw new Error('Function not implemented.');
}
