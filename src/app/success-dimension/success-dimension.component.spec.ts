import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SuccessDimensionComponent } from './success-dimension.component';

describe('SuccessDimensionComponent', () => {
  let component: SuccessDimensionComponent;
  let fixture: ComponentFixture<SuccessDimensionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SuccessDimensionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SuccessDimensionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
