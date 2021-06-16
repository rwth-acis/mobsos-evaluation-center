import {
  ComponentFixture,
  TestBed,
  waitForAsync,
} from '@angular/core/testing';

import { EditMeasureDialogComponent } from './edit-measure-dialog.component';
import {
  TranslateLoader,
  TranslateModule,
} from '@ngx-translate/core';
import { createTranslateLoader } from '../../app.module';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MarkdownModule } from 'ngx-markdown';
import { SqlTableComponent } from './sql-table/sql-table.component';
import { MatSelectModule } from '@angular/material/select';
import { SuccessMeasureComponent } from '../../success-measure/success-measure.component';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

import { LoggerModule, NgxLoggerLevel } from 'ngx-logger';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ValueVisualizationComponent } from '../../visualizations/value-visualization/value-visualization.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { KpiVisualizationComponent } from '../../visualizations/kpi-visualization/kpi-visualization.component';
import { MatInputModule } from '@angular/material/input';
import { INITIAL_APP_STATE } from 'src/app/models/state.model';
import { Measure } from 'src/app/models/measure.model';
import { ValueVisualization } from 'src/app/models/visualization.model';

describe('EditMeasureDialogComponent', () => {
  let component: EditMeasureDialogComponent;
  let fixture: ComponentFixture<EditMeasureDialogComponent>;
  const initialState = INITIAL_APP_STATE;
  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [
          EditMeasureDialogComponent,
          SqlTableComponent,
          SuccessMeasureComponent,
          ValueVisualizationComponent,
          ,
          KpiVisualizationComponent,
        ],
        imports: [
          BrowserAnimationsModule,
          MatDialogModule,
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
          FormsModule,
          MatFormFieldModule,
          MatDividerModule,
          MatExpansionModule,
          MarkdownModule,
          MatSelectModule,
          MatIconModule,
          MatProgressSpinnerModule,
          MatInputModule,
        ],
        providers: [
          { provide: MatDialogRef, useValue: {} },
          {
            provide: MAT_DIALOG_DATA,
            useValue: {
              measure: new Measure(
                'MeasureName',
                [],
                new ValueVisualization(''),
                [],
              ),
              service: {
                name: 'TestName',
                alias: 'TestAlias',
                mobsosIDs: [],
                serviceMessageDescriptions: {},
              },
              create: false,
            },
          },
          // provideMockStore({ initialState }),
          // StateEffects,
        ],
      }).compileComponents();
    }),
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(EditMeasureDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
