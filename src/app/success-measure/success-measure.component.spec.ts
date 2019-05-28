import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SuccessMeasureComponent } from './success-measure.component';

describe('SuccessMeasureComponent', () => {
  let component: SuccessMeasureComponent;
  let fixture: ComponentFixture<SuccessMeasureComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SuccessMeasureComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SuccessMeasureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
