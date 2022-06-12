import {
  ComponentFixture,
  TestBed,
  waitForAsync,
} from '@angular/core/testing';

import { SuccessMeasureComponent } from './success-measure.component';
import { LoggerModule, NgxLoggerLevel } from 'ngx-logger';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatIconModule } from '@angular/material/icon';
import {
  TranslateLoader,
  TranslateModule,
} from '@ngx-translate/core';
import { createTranslateLoader } from 'src/app/app.module';
import { MatDialogModule } from '@angular/material/dialog';
import { provideMockStore } from '@ngrx/store/testing';
import { INITIAL_APP_STATE } from 'src/app/models/state.model';

describe('SuccessMeasureComponent', () => {
  let component: SuccessMeasureComponent;
  let fixture: ComponentFixture<SuccessMeasureComponent>;
  const initialState = INITIAL_APP_STATE;
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [SuccessMeasureComponent],
      imports: [
        LoggerModule.forRoot({
          level: NgxLoggerLevel.TRACE,
          serverLogLevel: NgxLoggerLevel.OFF,
        }),
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useFactory: createTranslateLoader,
          },
        }),
        MatDialogModule,
        MatIconModule,
        HttpClientTestingModule,
      ],
      providers: [provideMockStore({ initialState })],
    }).compileComponents();
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
