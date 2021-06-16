import {
  async,
  ComponentFixture,
  TestBed,
  waitForAsync,
} from '@angular/core/testing';

import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { LoggerModule, NgxLoggerLevel } from 'ngx-logger';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { createTranslateLoader } from '../../app.module';
import { ChartVisualizerComponent } from './chart-visualization.component';

describe('ChartVisualizerComponent', () => {
  let component: ChartVisualizerComponent;
  let fixture: ComponentFixture<ChartVisualizerComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [ChartVisualizerComponent],
        imports: [
          MatProgressSpinnerModule,
          MatIconModule,

          TranslateModule.forRoot({
            loader: {
              provide: TranslateLoader,
              useFactory: createTranslateLoader,
            },
          }),
          LoggerModule.forRoot({
            level: NgxLoggerLevel.TRACE,
            serverLogLevel: NgxLoggerLevel.OFF,
          }),
          MatDialogModule,
          HttpClientTestingModule,
        ],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(ChartVisualizerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
