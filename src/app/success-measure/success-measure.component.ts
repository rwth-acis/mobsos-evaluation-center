import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {Measure} from "../../success-model/measure";
import {ServiceInformation} from "../store.service";
import {
  ChartVisualization,
  KpiVisualization,
  KpiVisualizationOperand,
  ValueVisualization
} from "../../success-model/visualization";
import {Las2peerService} from "../las2peer.service";
import {DomSanitizer, SafeHtml} from "@angular/platform-browser";
import {Query} from "../../success-model/query";
import {MatDialog} from "@angular/material";
import {ErrorDialogComponent} from "../error-dialog/error-dialog.component";

@Component({
  selector: 'app-success-measure',
  templateUrl: './success-measure.component.html',
  styleUrls: ['./success-measure.component.scss']
})
export class SuccessMeasureComponent implements OnInit, OnDestroy {
  @Input() measure: Measure;
  @Input() service: ServiceInformation;
  public visualization: SafeHtml;
  public error: Response;
  private refreshVisualizationHandle;
  private loadingDotsHandle;
  private loadingDotsCounter = [];

  constructor(private las2peer: Las2peerService, private sanitizer: DomSanitizer, private dialog: MatDialog) {
  }

  static htmlDecode(input) {
    const doc = new DOMParser().parseFromString(input, "text/html");
    return doc.documentElement.textContent;
  }

  ngOnInit() {
    this.refreshVisualization().then(visualization => this.visualization = visualization);
    this.refreshVisualizationHandle = setInterval(
      () => this.refreshVisualization().then(visualization => this.visualization = visualization),
      10000
    );
    this.loadingDotsHandle = setInterval(
      () => this.refreshLoadingDots(),
      1000
    )
  }

  ngOnDestroy(): void {
    clearInterval(this.refreshVisualizationHandle);
    clearInterval(this.loadingDotsHandle);
  }

  async refreshVisualization() {
    // special case: MobSOS has no knowledge of this service
    // thus we can save the REST call and use null as value
    if (this.service && this.service.mobsosIDs.length > 0) {
      let visualization;
      const queries = this.measure.queries;
      if (this.measure.visualization instanceof ValueVisualization) {
        visualization = await this.visualizeValue(queries);
      } else if (this.measure.visualization instanceof ChartVisualization) {
        visualization = await this.visualizeChart(queries, this.measure.visualization.chartType);
      } else if (this.measure.visualization instanceof KpiVisualization) {
        visualization = await this.visualizeKPI(queries, this.measure.visualization);
      } else {
        visualization = `The visualization type ${this.measure.visualization.type} is not supported yet.`
      }
      //console.error(visualization);
      return this.sanitizer.bypassSecurityTrustHtml(visualization);
    }
    return this.sanitizer.bypassSecurityTrustHtml('This service has not generated any data yet. ' +
      'A visualization should be shown as soon as you interact with it.');
  }

  refreshLoadingDots() {
    this.loadingDotsCounter = Array((this.loadingDotsCounter.length + 1) % 4);
  }

  async openErrorDialog() {
    console.error(this.error);
    const {value} = await this.error.body.getReader().read();
    const responseBody = new TextDecoder("utf-8").decode(value);
    const errorText = (this.error.statusText + ': ' + responseBody).trim();
    this.dialog.open(ErrorDialogComponent, {
      width: '80%',
      data: {error: errorText}
    });
  }

  private async visualizeValue(queries) {
    let query = queries[0].sql;
    const queryParams = this.getParamsForQuery(query);
    query = this.applyCompatibilityFixForVisualizationService(query);
    const data = JSON.parse(await this.fetchVisualization(query, queryParams, 'JSON'));
    const value = data.slice(-1)[0].length == 0 ? 0 : data.slice(-1)[0][0];
    return `<div class="value-visualization">${value}</div>`;
  }

  private async visualizeChart(queries, chartType) {
    let format: string;
    switch (chartType) {
      case 'LineChart':
        format = 'GOOGLELINECHART';
        break;
      case 'PieChart':
        format = 'GOOGLEPIECHART';
        break;
      case 'BarChart':
        format = 'GOOGLEBARCHART';
        break;
      case 'RadarChart':
        format = 'GOOGLERADARCHART';
        break;
      case 'TimelineChart':
        format = 'GOOGLETIMELINECHART';
        break;
      default:
        return `Chart type ${chartType} is not supported yet.`
    }
    let query = queries[0].sql;
    const queryParams = this.getParamsForQuery(query);
    query = this.applyCompatibilityFixForVisualizationService(query);
    const data = await this.fetchVisualization(query, queryParams, format);
    return data;
  }

  private fetchVisualization(query, queryParams, format: string) {
    return this.las2peer.visualizeQuery(query, queryParams, format).then(data => {
      this.error = null;
      return data;
    }).catch(error => this.error = error);
  }

  private async visualizeKPI(queries: Query[], visualization: KpiVisualization) {
    const abstractTerm = [];
    const term = [];

    for (let operationElement of visualization.operationsElements) {
      abstractTerm.push(operationElement.name);
      if (operationElement instanceof KpiVisualizationOperand) {
        const query = queries.find(value => value.name == operationElement.name);
        let sql = query.sql;
        const queryParams = this.getParamsForQuery(sql);
        sql = this.applyCompatibilityFixForVisualizationService(sql);
        let response;
        try {
          response = await this.fetchVisualization(sql, queryParams, 'JSON');
          const data = JSON.parse(response);
          const value = data.slice(-1)[0].length == 0 ? 0 : data.slice(-1)[0][0];
          term.push(value);
        } catch (e) {
          return;
        }
      } else {
        term.push(operationElement.name);
      }
    }
    if (term.length > 1) {
      abstractTerm.push('=');
      abstractTerm.push(this.measure.name);
      const termResult = visualization.evaluateTerm(term);
      term.push('=');
      term.push(termResult);
    }
    let result = `<div class="value-visualization">${term.join(' ')}</div>`;
    if (term.length > 1) {
      result = `<div>${abstractTerm.join(' ')}</div>` + result;
    }
    return result;
  }

  private getParamsForQuery(query: string) {
    if (this.service.mobsosIDs.length === 0) {
      // just for robustness
      // should not be called when there are no service IDs stored in MobSOS anyway
      return [];
    }
    let serviceRegex = /\$SERVICE\$/g;
    let matches = query.match(serviceRegex);
    let params = [];
    for (let match of matches) {
      // for now we just use the first ID
      // support for multiple IDs is not implemented yet
      params.push(this.service.mobsosIDs[0]);
    }
    return params;
  }

  private applyCompatibilityFixForVisualizationService(query: string) {
    // note that the replace value is actually $$SERVICE$$, but each $ must be escaped with another $
    query = query.replace(/\$SERVICE\$/g, '$$$$SERVICE$$$$');
    query = SuccessMeasureComponent.htmlDecode(query);
    return query;
  }
}
