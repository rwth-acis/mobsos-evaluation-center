import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';

import { QuestionnaireInfoDialogComponent } from './questionnaire-info-dialog.component';

describe('QuestionnaireInfoDialogComponent', () => {
  let component: QuestionnaireInfoDialogComponent;
  let fixture: ComponentFixture<QuestionnaireInfoDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [QuestionnaireInfoDialogComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: [] },
        { provide: MatDialogRef, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(
      QuestionnaireInfoDialogComponent,
    );
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
