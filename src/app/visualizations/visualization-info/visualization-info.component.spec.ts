import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VisualizationInfoComponent } from './visualization-info.component';

describe('VisualizationInfoComponent', () => {
  let component: VisualizationInfoComponent;
  let fixture: ComponentFixture<VisualizationInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VisualizationInfoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VisualizationInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
