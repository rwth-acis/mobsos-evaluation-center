import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PickSurveyDialogComponent } from './pick-survey-dialog.component';

describe('PickSurveyDialogComponent', () => {
  let component: PickSurveyDialogComponent;
  let fixture: ComponentFixture<PickSurveyDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PickSurveyDialogComponent ]
    })
    .compileComponents();
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
