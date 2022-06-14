import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { RouterTestingModule } from '@angular/router/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { Las2peerService } from 'src/app/services/las2peer.service';
import { initialState } from 'src/app/services/store/store.reducer';

import { PickSurveyDialogComponent } from './pick-survey-dialog.component';

describe('PickSurveyDialogComponent', () => {
  let component: PickSurveyDialogComponent;
  let fixture: ComponentFixture<PickSurveyDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PickSurveyDialogComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: [] },
        { provide: MatDialogRef, useValue: {} },
        provideMockStore({ initialState }),
        {
          provide: Las2peerService,
          useValue: {
            createSurvey: of(null),
            setQuestionnaireForSurvey: of(null),
          },
        },
      ],
      imports: [
        MatDialogModule,
        RouterTestingModule,
        ReactiveFormsModule,
        MatAutocompleteModule,
        TranslateModule.forRoot(),
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PickSurveyDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
