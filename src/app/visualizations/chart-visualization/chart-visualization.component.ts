import { Component, Input, OnInit } from '@angular/core';
import { BaseVisualizationComponent } from '../visualization.component';
import { Las2peerService } from '../../las2peer.service';
import { MatDialog } from '@angular/material/dialog';
import { map } from 'lodash-es';
import { ChartVisualization } from '../../../success-model/visualization';
import { TranslateService } from '@ngx-translate/core';
import { environment } from '../../../environments/environment';
import { Measure } from 'src/success-model/measure';
import { ServiceInformation } from 'src/app/store.service';
import { Store } from '@ngrx/store';
import { fetchVisualizationData } from 'src/app/services/store.actions';
import {
  VISUALIZATION_DATA,
  VISUALIZATION_DATA_FOR_QUERY,
} from 'src/app/services/store.selectors';

class GoogleChart {
  constructor(
    public title: string,
    public chartType: string,
    public data: [][],
    public columns: string[]
  ) {}
}

@Component({
  selector: 'app-chart-visualization',
  templateUrl: './chart-visualization.component.html',
  styleUrls: ['./chart-visualization.component.scss'],
})
export class ChartVisualizationComponent
  extends BaseVisualizationComponent
  implements OnInit
{
  @Input() measure: Measure;
  @Input() service: ServiceInformation;
  chart: GoogleChart;
  data: [][];
  data$ = this.ngrxStore.select(
    VISUALIZATION_DATA_FOR_QUERY,
    this.measure.queries[0].sql
  );
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
      ChartVisualizationComponent.applyCompatibilityFixForVisualizationService(
        query
      );
    super.fetchVisualizationData(query, queryParams);
    this.data$.subscribe((dataTable) => {
      if (dataTable instanceof Array && dataTable.length >= 2) {
        const data = dataTable.slice(2);
        this.chart = new GoogleChart(
          '',
          visualization.chartType,
          data,
          dataTable[0]
        );
        if (this.chart) this.visualizationInitialized = true;
      }
    });
  }
}
