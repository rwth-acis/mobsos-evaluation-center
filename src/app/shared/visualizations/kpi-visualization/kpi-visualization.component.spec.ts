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
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { INITIAL_APP_STATE } from 'src/app/models/state.model';
import { of } from 'rxjs';
import { MatMenuModule } from '@angular/material/menu';

describe('KpiVisualizationComponent', () => {
  let component: KpiVisualizationComponent;
  let fixture: ComponentFixture<KpiVisualizationComponent>;
  const initialState = INITIAL_APP_STATE;
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [KpiVisualizationComponent],
      imports: [
        MatProgressSpinnerModule,
        MatIconModule,
        MatMenuModule,
        LoggerModule.forRoot({
          level: NgxLoggerLevel.TRACE,
          serverLogLevel: NgxLoggerLevel.OFF,
        }),
        MatDialogModule,
        HttpClientTestingModule,
      ],
      providers: [provideMockStore({ initialState })],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KpiVisualizationComponent);
    component = fixture.componentInstance;
    component.data$ = of(null);
    component.visualization$ = of(null);
    component.description$ = of(null);
    component.queries$ = of(null);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
