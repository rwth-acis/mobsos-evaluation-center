import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ValueVisualizationComponent } from './value-visualization.component';

describe('ValueVisualizationComponent', () => {
  let component: ValueVisualizationComponent;
  let fixture: ComponentFixture<ValueVisualizationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ValueVisualizationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ValueVisualizationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
