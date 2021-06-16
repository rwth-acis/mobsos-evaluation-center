import { Component, Input, OnInit } from '@angular/core';
import { BaseVisualizationComponent } from '../visualization.component';
import { Las2peerService } from '../../las2peer.service';
import { MatDialog } from '@angular/material/dialog';
import { KpiVisualization } from '../../../success-model/visualization';

import { Measure } from 'src/success-model/measure';

import { Store } from '@ngrx/store';
import {
  MEASURE,
  VISUALIZATION_DATA_FOR_QUERY,
} from 'src/app/services/store.selectors';
import { ServiceInformation } from 'src/app/models/service.model';

@Component({
  selector: 'app-kpi-visualization',
  templateUrl: './kpi-visualization.component.html',
  styleUrls: ['./kpi-visualization.component.scss'],
})
export class KpiVisualizationComponent
  extends BaseVisualizationComponent
  implements OnInit
{
  abstractTerm = [];
  term = [];

  constructor(dialog: MatDialog, protected ngrxStore: Store) {
    super(ngrxStore, dialog);
  }
  @Input() measure: Measure;
  @Input() measureName: string;
  measure$;
  @Input() service: ServiceInformation;

  async ngOnInit() {
    this.measure$ = this.ngrxStore.select(MEASURE, this.measureName);
    const queries = this.measure.queries;
    let visualization: KpiVisualization = this.measure
      .visualization as KpiVisualization;
    if (!(visualization instanceof KpiVisualization)) {
      visualization = new KpiVisualization(
        (visualization as KpiVisualization).operationsElements,
      );
    }
    const abstractTerm = [];
    const term = [];

    for (const operationElement of visualization.operationsElements) {
      abstractTerm.push(operationElement.name);
      // even index means, that this must be an operand since we only support binary operators
      if (operationElement.index % 2 === 0) {
        const query = queries.find(
          (value) => value.name === operationElement.name,
        );
        let sql = query.sql;
        const queryParams = this.getParamsForQuery(sql);
        sql = this.applyVariableReplacements(sql, this.service);
        sql =
          KpiVisualizationComponent.applyCompatibilityFixForVisualizationService(
            sql,
          );
        let response;
        try {
          super.fetchVisualizationData(sql, queryParams);
          response = await this.ngrxStore
            .select(VISUALIZATION_DATA_FOR_QUERY, sql)
            .toPromise();
          const data = response.data;
          const value =
            data.slice(-1)[0].length === 0 ? 0 : data.slice(-1)[0][0];
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
      let termResult = visualization.evaluateTerm(term);
      if (typeof termResult === 'number') {
        termResult = termResult.toFixed(2);
      }
      term.push('=');
      term.push(termResult);
    }
    this.abstractTerm = abstractTerm;
    this.term = term;
  }
}
