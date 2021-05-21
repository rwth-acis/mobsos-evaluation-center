import { Component, Input, OnInit } from '@angular/core';
import { BaseVisualizationComponent } from '../visualization.component';
import { MatDialog } from '@angular/material/dialog';
import { ChartVisualization } from '../../../success-model/visualization';
import { Measure } from 'src/success-model/measure';
import { ServiceInformation } from 'src/app/store.service';
import { Store } from '@ngrx/store';
import { VISUALIZATION_DATA_FOR_QUERY } from 'src/app/services/store.selectors';
import { filter } from 'rxjs/operators';
import { VData } from 'src/app/models/visualization.model';
import { Observable } from 'rxjs';
import { animation } from '@angular/animations';

class GoogleChart {
  constructor(
    public title: string,
    public chartType: string,
    public data: any[][],
    public columns: string[],
    public options: object
  ) {}
}

@Component({
  selector: 'app-chart-visualization',
  templateUrl: './chart-visualization.component.html',
  styleUrls: ['./chart-visualization.component.scss'],
})
export class ChartVisualizerComponent
  extends BaseVisualizationComponent
  implements OnInit
{
  @Input() measure: Measure;
  @Input() service: ServiceInformation;
  chart: GoogleChart;
  data: any[][];
  data$: Observable<any[][]>;
  columns;

  constructor(dialog: MatDialog, protected ngrxStore: Store) {
    super(ngrxStore, dialog);
  }
  ngOnInit() {
    if (!this.measure || !this.service)
      return console.error('Service or measure undefined');
    // this.graph.config.locale = this.translate.currentLang;
    const visualization = this.measure.visualization as ChartVisualization;
    let query = this.measure.queries[0].sql;
    const queryParams = this.getParamsForQuery(query);
    query = this.applyVariableReplacements(query, this.service);
    query =
      BaseVisualizationComponent.applyCompatibilityFixForVisualizationService(
        query
      );
    super.fetchVisualizationData(query, queryParams);

    this.data$ = this.ngrxStore.select(VISUALIZATION_DATA_FOR_QUERY, query);
    this.data$.pipe(filter((data) => !!data)).subscribe((data) => {
      const dataTable = data;
      if (dataTable instanceof Array && dataTable.length >= 2) {
        const rows = dataTable.slice(2) as any[][];
        this.chart = new GoogleChart(
          '',
          visualization.chartType,
          rows,
          dataTable[0],
          {
            colors: ['#00796b', '#ff4081', '#40c4ff', '#ff5252', '#ffd600'],
            animation: { startup: true },
          }
        );
        if (this.chart) this.visualizationInitialized = true;
      }
    });
  }
}
