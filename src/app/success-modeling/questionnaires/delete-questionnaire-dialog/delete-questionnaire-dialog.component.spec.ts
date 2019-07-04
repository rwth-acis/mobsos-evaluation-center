import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteQuestionnaireDialogComponent } from './delete-questionnaire-dialog.component';

describe('DeleteQuestionnaireDialogComponent', () => {
  let component: DeleteQuestionnaireDialogComponent;
  let fixture: ComponentFixture<DeleteQuestionnaireDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DeleteQuestionnaireDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeleteQuestionnaireDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
