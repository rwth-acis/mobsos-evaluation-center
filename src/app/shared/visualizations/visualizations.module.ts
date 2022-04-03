import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ErrorDialogComponent } from './error-dialog/error-dialog.component';
import { VisualizationComponent } from './visualization.component';
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

@NgModule({
  declarations: [
    ErrorDialogComponent,
    VisualizationComponent,
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
    TranslateModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
  ],
  exports: [VisualizationComponent],
})
export class VisualizationsModule {}
