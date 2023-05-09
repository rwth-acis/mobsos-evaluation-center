import {
  async,
  ComponentFixture,
  TestBed,
  waitForAsync,
} from '@angular/core/testing';

import { PickMeasureDialogComponent } from './pick-measure-dialog.component';
import {
  TranslateLoader,
  TranslateModule,
} from '@ngx-translate/core';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { MatIconModule } from '@angular/material/icon';
import {
  MatLegacyDialogModule as MatDialogModule,
  MatLegacyDialogRef as MatDialogRef,
  MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA,
} from '@angular/material/legacy-dialog';
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card';
import { provideMockStore } from '@ngrx/store/testing';
import { INITIAL_APP_STATE } from 'src/app/models/state.model';
import { SuccessMeasureComponent } from '../success-measure/success-measure.component';
import { createTranslateLoader } from 'src/app/app.module';

describe('PickMeasureDialogComponent', () => {
  let component: PickMeasureDialogComponent;
  let fixture: ComponentFixture<PickMeasureDialogComponent>;
  const initialState = INITIAL_APP_STATE;
  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [
          PickMeasureDialogComponent,
          SuccessMeasureComponent,
        ],
        imports: [
          BrowserAnimationsModule,
          TranslateModule.forRoot({
            loader: {
              provide: TranslateLoader,
              useFactory: createTranslateLoader,
            },
          }),
          MatDialogModule,
          MatCardModule,
          MatIconModule,
        ],
        providers: [
          { provide: MatDialogRef, useValue: {} },
          {
            provide: MAT_DIALOG_DATA,
            useValue: {
              measures: [],
              service: {},
            },
          },
          provideMockStore({ initialState }),
        ],
      }).compileComponents();
    }),
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(PickMeasureDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
