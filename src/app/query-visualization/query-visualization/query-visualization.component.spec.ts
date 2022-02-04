import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QueryVisualizationComponent } from './query-visualization.component';

describe('QueryVisualizationComponent', () => {
  let component: QueryVisualizationComponent;
  let fixture: ComponentFixture<QueryVisualizationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ QueryVisualizationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(QueryVisualizationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
