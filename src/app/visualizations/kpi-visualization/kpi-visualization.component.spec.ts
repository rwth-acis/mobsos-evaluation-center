import {
  async,
  ComponentFixture,
  TestBed,
  waitForAsync,
} from '@angular/core/testing';

import { KpiVisualizationComponent } from './kpi-visualization.component';

import { LoggerModule, NgxLoggerLevel } from 'ngx-logger';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';

describe('KpiVisualizationComponent', () => {
  let component: KpiVisualizationComponent;
  let fixture: ComponentFixture<KpiVisualizationComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [KpiVisualizationComponent],
        imports: [
          MatProgressSpinnerModule,
          MatIconModule,
          LoggerModule.forRoot({
            level: NgxLoggerLevel.TRACE,
            serverLogLevel: NgxLoggerLevel.OFF,
          }),
          MatDialogModule,
          HttpClientTestingModule,
        ],
      }).compileComponents();
    }),
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(KpiVisualizationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
