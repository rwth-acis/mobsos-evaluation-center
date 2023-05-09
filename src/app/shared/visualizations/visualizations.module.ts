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
import { MatLegacyMenuModule as MatMenuModule } from '@angular/material/legacy-menu';
import { TranslateModule } from '@ngx-translate/core';
import { MatLegacyPaginatorModule as MatPaginatorModule } from '@angular/material/legacy-paginator';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyTableModule as MatTableModule } from '@angular/material/legacy-table';
import { EvaluatePipe } from '../evaluate.pipe';
import { LatexPipe } from '../latex.pipe';
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog';
import { MatLegacyProgressSpinnerModule as MatProgressSpinnerModule } from '@angular/material/legacy-progress-spinner';
import { MatLegacyTooltipModule as MatTooltipModule } from '@angular/material/legacy-tooltip';
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
