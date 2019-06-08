import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {ChartVisualizationComponent} from './chart-visualization.component';
import {MatDialogModule, MatIconModule, MatProgressSpinnerModule} from '@angular/material';
import {PlotlyModule} from 'angular-plotly.js';
import {LoggerModule, NgxLoggerLevel} from 'ngx-logger';
import {HttpClientTestingModule} from '@angular/common/http/testing';

describe('ChartVisualizationComponent', () => {
  let component: ChartVisualizationComponent;
  let fixture: ComponentFixture<ChartVisualizationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ChartVisualizationComponent],
      imports: [
        MatProgressSpinnerModule,
        MatIconModule,
        PlotlyModule,
        LoggerModule.forRoot({
          level: NgxLoggerLevel.TRACE,
          serverLogLevel: NgxLoggerLevel.OFF
        }),
        MatDialogModule,
        HttpClientTestingModule,
      ],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChartVisualizationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
