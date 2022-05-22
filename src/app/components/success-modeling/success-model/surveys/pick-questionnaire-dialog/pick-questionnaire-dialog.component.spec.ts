import {
  async,
  ComponentFixture,
  TestBed,
  waitForAsync,
} from '@angular/core/testing';

import { PickQuestionnaireDialogComponent } from './pick-questionnaire-dialog.component';
import {
  TranslateLoader,
  TranslateModule,
} from '@ngx-translate/core';
import { createTranslateLoader } from 'src/app/app.module';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { provideMockStore } from '@ngrx/store/testing';
import { initialState } from 'src/app/services/store/store.reducer';
import { StateEffects } from 'src/app/services/store/store.effects';
import { Actions } from '@ngrx/effects';
import { provideMockActions } from '@ngrx/effects/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';

describe('PickQuestionnaireDialogComponent', () => {
  let component: PickQuestionnaireDialogComponent;
  let fixture: ComponentFixture<PickQuestionnaireDialogComponent>;
  let actions: Actions;
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [PickQuestionnaireDialogComponent],
      imports: [
        BrowserAnimationsModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useFactory: createTranslateLoader,
          },
        }),
        MatIconModule,
        MatSelectModule,
        MatFormFieldModule,
        MatDialogModule,
        MatButtonModule,
        FormsModule,
        MatCheckboxModule,
      ],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: [] },
        { provide: MatDialogRef, useValue: {} },
        provideMockStore({ initialState }),
        {
          provide: StateEffects,
          useValue: { fetchQuestionnaireForm$: of(null) },
        },
        provideMockActions(() => actions),
        HttpClientTestingModule,
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(
      PickQuestionnaireDialogComponent,
    );
    component = fixture.componentInstance;
    TestBed.inject(StateEffects);
    TestBed.inject(Actions);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
