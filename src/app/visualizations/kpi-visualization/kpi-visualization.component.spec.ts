import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KpiVisualizationComponent } from './kpi-visualization.component';
import {MatDialogModule, MatIconModule, MatProgressSpinnerModule} from '@angular/material';
import {PlotlyModule} from 'angular-plotly.js';
import {LoggerModule, NgxLoggerLevel} from 'ngx-logger';
import {HttpClientTestingModule} from '@angular/common/http/testing';

describe('KpiVisualizationComponent', () => {
  let component: KpiVisualizationComponent;
  let fixture: ComponentFixture<KpiVisualizationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KpiVisualizationComponent ],
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
    fixture = TestBed.createComponent(KpiVisualizationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
