import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ValueVisualizationComponent } from './value-visualization.component';
import {MatDialogModule, MatIconModule, MatProgressSpinnerModule} from '@angular/material';
import {PlotlyModule} from 'angular-plotly.js';
import {LoggerModule, NgxLoggerLevel} from 'ngx-logger';
import {HttpClientTestingModule} from '@angular/common/http/testing';

describe('ValueVisualizationComponent', () => {
  let component: ValueVisualizationComponent;
  let fixture: ComponentFixture<ValueVisualizationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ValueVisualizationComponent ],
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
    fixture = TestBed.createComponent(ValueVisualizationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
