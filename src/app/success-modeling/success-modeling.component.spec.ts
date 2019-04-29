import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {SuccessModelingComponent} from './success-modeling.component';

describe('SuccessModelingComponent', () => {
  let component: SuccessModelingComponent;
  let fixture: ComponentFixture<SuccessModelingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SuccessModelingComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SuccessModelingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
