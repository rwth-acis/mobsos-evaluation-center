import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { provideMockStore } from '@ngrx/store/testing';
import { initialState } from 'src/app/services/store/store.reducer';

import { LimesurveyManagementComponent } from './limesurvey-management.component';

describe('LimesurveyManagementComponent', () => {
  let component: LimesurveyManagementComponent;
  let fixture: ComponentFixture<LimesurveyManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LimesurveyManagementComponent],
      imports: [ReactiveFormsModule],
      providers: [provideMockStore({ initialState })],
    }).compileComponents();
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
