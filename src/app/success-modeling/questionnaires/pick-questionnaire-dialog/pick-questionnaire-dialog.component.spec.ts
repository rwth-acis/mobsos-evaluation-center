import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PickQuestionnaireDialogComponent } from './pick-questionnaire-dialog.component';

describe('PickQuestionnaireDialogComponent', () => {
  let component: PickQuestionnaireDialogComponent;
  let fixture: ComponentFixture<PickQuestionnaireDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PickQuestionnaireDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PickQuestionnaireDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
