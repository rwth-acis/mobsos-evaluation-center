import {Component, OnInit} from '@angular/core';
import {BaseVisualizationComponent} from '../visualization.component';
import {Las2peerService} from '../../las2peer.service';
import {MatDialog} from '@angular/material';
import {map} from 'lodash-es';
import {ChartVisualization} from '../../../success-model/visualization';

@Component({
  selector: 'app-chart-visualization',
  templateUrl: './chart-visualization.component.html',
  styleUrls: ['./chart-visualization.component.scss']
})
export class ChartVisualizationComponent extends BaseVisualizationComponent implements OnInit {
  public graph = {
    data: [],
    layout: {width: 320, height: 120},
    config: {displayModeBar: false}
  };

  constructor(las2peer: Las2peerService, dialog: MatDialog, ) {
    super(las2peer, dialog);
  }

  async renderVisualization() {
    const visualization = this.measure.visualization as ChartVisualization;
    let query = this.measure.queries[0].sql;
    const queryParams = this.getParamsForQuery(query);
    query = ChartVisualizationComponent.applyCompatibilityFixForVisualizationService(query);
    const dataTable = JSON.parse(await this.fetchVisualization(query, queryParams, 'JSON'));
    if (dataTable instanceof Array && dataTable.length >= 2) {
      const typeList = dataTable[1] as Array<string>;
      const data = dataTable.slice(2);
      switch (visualization.chartType) {
        case 'LineChart':
          return this.renderLineChart(typeList, data);
        case 'PieChart':
          return this.renderPieChart(typeList, data);
      }
    }
  }

  private async renderLineChart(typeList: string[], data: any[]) {
    let x = map(data, 0);
    let y = map(data, 1);
    x = this.performTypeCast(typeList[0], x);
    y = this.performTypeCast(typeList[1], y);
    this.graph.data = [{x, y, type: 'scatter', mode: 'lines+points'}];
  }

  private async renderPieChart(typeList: string[], data: any[]) {
    let labels = map(data, 0);
    let values = map(data, 1);
    labels = this.performTypeCast(typeList[0], labels);
    values = this.performTypeCast(typeList[1], values);
    this.graph.data = [{labels, values, type: 'pie'}];
  }

  private performTypeCast(type: string, data: any[]) {
    switch (type) {
      case 'datetime':
        return data.map((value) => {
          // correct timestamp because it is in local time and not UTC
          value = Number(value) + new Date().getTimezoneOffset() * 60000;
          return new Date(value);
        });
      case 'number':
        return data.map((value) => Number(value));
      default:
        return data;
    }
  }

}
