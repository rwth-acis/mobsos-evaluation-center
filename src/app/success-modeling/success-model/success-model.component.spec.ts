import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuccessModelComponent } from './success-model.component';

describe('SuccessModelComponent', () => {
  let component: SuccessModelComponent;
  let fixture: ComponentFixture<SuccessModelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SuccessModelComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SuccessModelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
