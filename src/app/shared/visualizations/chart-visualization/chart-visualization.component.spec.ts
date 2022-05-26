import {
  ComponentFixture,
  TestBed,
  waitForAsync,
} from '@angular/core/testing';

import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { LoggerModule, NgxLoggerLevel } from 'ngx-logger';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import {
  TranslateLoader,
  TranslateModule,
} from '@ngx-translate/core';
import { createTranslateLoader } from 'src/app/app.module';
import { ChartVisualizerComponent } from './chart-visualization.component';
import { provideMockStore } from '@ngrx/store/testing';
import { INITIAL_APP_STATE } from 'src/app/models/state.model';
import { ScriptLoaderService } from 'angular-google-charts';
import { MatMenuModule } from '@angular/material/menu';
import { of } from 'rxjs';

describe('ChartVisualizerComponent', () => {
  let component: ChartVisualizerComponent;
  let fixture: ComponentFixture<ChartVisualizerComponent>;
  const initialState = INITIAL_APP_STATE;
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ChartVisualizerComponent],
      imports: [
        MatProgressSpinnerModule,
        MatIconModule,
        MatMenuModule,
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
      providers: [
        provideMockStore({ initialState }),
        {
          provide: ScriptLoaderService,
          useValue: {
            loadChartPackages: () => of(null),
          },
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChartVisualizerComponent);
    component = fixture.componentInstance;
    component.measure$ = of(null);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
