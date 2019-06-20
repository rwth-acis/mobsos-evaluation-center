import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PickMeasureDialogComponent } from './pick-measure-dialog.component';

describe('PickMeasureDialogComponent', () => {
  let component: PickMeasureDialogComponent;
  let fixture: ComponentFixture<PickMeasureDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PickMeasureDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PickMeasureDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
