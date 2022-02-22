import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuestionnaireInfoDialogComponent } from './questionnaire-info-dialog.component';

describe('QuestionnaireInfoDialogComponent', () => {
  let component: QuestionnaireInfoDialogComponent;
  let fixture: ComponentFixture<QuestionnaireInfoDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ QuestionnaireInfoDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(QuestionnaireInfoDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
