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

  constructor(
    las2peer: Las2peerService,
    dialog: MatDialog,
    private ngrxStore: Store
  ) {
    super(las2peer, dialog);
  }
  async ngOnInit() {
    if (!this.measure || !this.service) return;
    // this.graph.config.locale = this.translate.currentLang;
    const visualization = this.measure.visualization as ChartVisualization;
    let query = this.measure.queries[0].sql;
    const queryParams = this.getParamsForQuery(query);
    query = this.applyVariableReplacements(query, this.service);
    query =
      ChartVisualizationComponent.applyCompatibilityFixForVisualizationService(
        query
      );
    this.ngrxStore.dispatch(fetchVisualizationData({ query, queryParams }));
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

  async renderVisualization() {
    // this.graph.config.locale = this.translate.currentLang;
    // const visualization = this.measure.visualization as ChartVisualization;
    // let query = this.measure.queries[0].sql;
    // const queryParams = this.getParamsForQuery(query);
    // // query = this.applyVariableReplacements(query);
    // query =
    //   ChartVisualizationComponent.applyCompatibilityFixForVisualizationService(
    //     query
    //   );
    // const dataTable = await this.fetchVisualization(query, queryParams, 'JSON');
    // if (dataTable instanceof Array && dataTable.length >= 2) {
    //   console.log(dataTable);
    //   const typeList = dataTable[1] as Array<string>;
    //   const data = dataTable.slice(2);
    //   switch (visualization.chartType) {
    //     case 'LineChart':
    //       return this.renderLineChart(typeList, data);
    //     case 'PieChart':
    //       return this.renderPieChart(typeList, data);
    //     case 'BarChart':
    //       return this.renderBarChart(typeList, data);
    //     case 'RadarChart':
    //       return this.renderRadarChart(typeList, data);
    //   }
    // }
  }

  private async renderLineChart(typeList: string[], data: any[]) {
    let x = map(data, 0);
    let y = map(data, 1);
    x = this.performTypeCast(typeList[0], x);
    y = this.performTypeCast(typeList[1], y);
    // this.graph.data = [{ x, y, type: 'scatter', mode: 'lines+points' }];
    // this.graph.layout.xaxis.type = '-';
  }

  private async renderPieChart(typeList: string[], data: any[]) {
    let labels = map(data, 0);
    let values = map(data, 1);
    labels = this.performTypeCast(typeList[0], labels);
    values = this.performTypeCast(typeList[1], values);
    // this.graph.data = [{ labels, values, type: 'pie' }];
    // this.graph.layout.xaxis.type = '-';
  }

  private async renderBarChart(typeList: string[], data: any[]) {
    let labels = map(data, 0);
    let values = map(data, 1);
    labels = this.performTypeCast(typeList[0], labels);
    values = this.performTypeCast(typeList[1], values);
    // this.graph.data = [{ x: labels, y: values, type: 'bar' }];
    // this.graph.layout.xaxis.type = 'category';
  }

  private async renderRadarChart(typeList: string[], data: any[]) {
    let labels = map(data, 0);
    let values = map(data, 1);
    labels = this.performTypeCast(typeList[0], labels);
    values = this.performTypeCast(typeList[1], values);
    // this.graph.data = [
    //   { theta: labels, r: values, fill: 'toself', type: 'scatterpolar' },
    // ];
    // this.graph.layout.polar = {
    //   radialaxis: {
    //     visible: true,
    //   },
    // };
    // this.graph.layout.xaxis.type = '-';
  }

  private performTypeCast(type: string, data: any[]) {
    switch (type) {
      case 'datetime':
        return data.map((value) => {
          value = Number(value);
          if (environment.correctTimestamps) {
            // correct timestamp because it is in local time and not UTC
            value = value + new Date().getTimezoneOffset() * 60000;
          }
          return new Date(value);
        });
      case 'number':
        return data.map((value) => Number(value));
      default:
        return data;
    }
  }
}
