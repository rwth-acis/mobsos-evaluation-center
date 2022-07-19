import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LimesurveyManagementComponent } from './limesurvey-management.component';

describe('LimesurveyManagementComponent', () => {
  let component: LimesurveyManagementComponent;
  let fixture: ComponentFixture<LimesurveyManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LimesurveyManagementComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LimesurveyManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
