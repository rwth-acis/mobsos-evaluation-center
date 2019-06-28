import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditMeasureDialogComponent } from './edit-measure-dialog.component';

describe('EditMeasureDialogComponent', () => {
  let component: EditMeasureDialogComponent;
  let fixture: ComponentFixture<EditMeasureDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EditMeasureDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditMeasureDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
