import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ErrorDialogComponent } from './error-dialog/error-dialog.component';
import { ValueVisualizationComponent } from './value-visualization/value-visualization.component';
import { ChartVisualizerComponent } from './chart-visualization/chart-visualization.component';
import { KpiVisualizationComponent } from './kpi-visualization/kpi-visualization.component';
import { VisualizationInfoComponent } from './visualization-info/visualization-info.component';
import { RawDataDialogComponent } from './raw-data-dialog/raw-data-dialog.component';
import { StaticChartComponent } from './chart-visualization/static-chart/static-chart.component';
import { GoogleChartsModule } from 'angular-google-charts';
import { MatMenuModule } from '@angular/material/menu';
import { TranslateModule } from '@ngx-translate/core';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { EvaluatePipe } from '../evaluate.pipe';
import { LatexPipe } from '../latex.pipe';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgxPrintModule } from 'ngx-print';
@NgModule({
  declarations: [
    ErrorDialogComponent,
    EvaluatePipe,
    LatexPipe,
    ValueVisualizationComponent,
    ChartVisualizerComponent,
    KpiVisualizationComponent,
    VisualizationInfoComponent,
    RawDataDialogComponent,
    StaticChartComponent,
  ],
  imports: [
    CommonModule,
    GoogleChartsModule,
    MatMenuModule,
    NgxPrintModule,
    MatProgressSpinnerModule,
    TranslateModule,
    MatPaginatorModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatDialogModule,
    MatTooltipModule,
  ],
  exports: [
    ValueVisualizationComponent,
    ChartVisualizerComponent,
    KpiVisualizationComponent,
  ],
})
export class VisualizationsModule {}
