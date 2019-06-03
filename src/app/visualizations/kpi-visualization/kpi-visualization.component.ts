import {Component, OnInit, SimpleChanges} from '@angular/core';
import {BaseVisualizationComponent} from "../visualization.component";
import {Las2peerService} from "../../las2peer.service";
import {MatDialog} from "@angular/material";
import {KpiVisualization, KpiVisualizationOperand} from "../../../success-model/visualization";

@Component({
  selector: 'app-kpi-visualization',
  templateUrl: './kpi-visualization.component.html',
  styleUrls: ['./kpi-visualization.component.scss']
})
export class KpiVisualizationComponent extends BaseVisualizationComponent implements OnInit {
  abstractTerm = [];
  term = [];

  constructor(las2peer: Las2peerService, dialog: MatDialog,) {
    super(las2peer, dialog);
  }

  async renderVisualization() {
    const queries = this.measure.queries;
    const visualization: KpiVisualization = this.measure.visualization as KpiVisualization;
    const abstractTerm = [];
    const term = [];

    for (let operationElement of visualization.operationsElements) {
      abstractTerm.push(operationElement.name);
      if (operationElement instanceof KpiVisualizationOperand) {
        const query = queries.find(value => value.name == operationElement.name);
        let sql = query.sql;
        const queryParams = this.getParamsForQuery(sql);
        sql = KpiVisualizationComponent.applyCompatibilityFixForVisualizationService(sql);
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
    this.abstractTerm = abstractTerm;
    this.term = term;
  }

}
