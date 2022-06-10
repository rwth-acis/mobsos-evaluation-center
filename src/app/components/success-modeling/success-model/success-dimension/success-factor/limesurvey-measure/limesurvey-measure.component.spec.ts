import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LimesurveyMeasureComponent } from './limesurvey-measure.component';

describe('LimesurveyMeasureComponent', () => {
  let component: LimesurveyMeasureComponent;
  let fixture: ComponentFixture<LimesurveyMeasureComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LimesurveyMeasureComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LimesurveyMeasureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
