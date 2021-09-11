import { Component, Inject, OnInit } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
} from '@angular/material/dialog';
import { ServiceInformation } from 'src/app/models/service.model';
import { Measure } from 'src/app/models/measure.model';
import {
  ChartVisualization,
  KpiVisualization,
  KpiVisualizationOperand,
  KpiVisualizationOperator,
  ValueVisualization,
} from 'src/app/models/visualization.model';
import { Query } from 'src/app/models/query.model';
import { fetchVisualizationData } from 'src/app/services/store.actions';
import { Store } from '@ngrx/store';

export interface DialogData {
  measure: Measure;
  service: ServiceInformation;
  create: boolean;
  description: string;
}

@Component({
  selector: 'app-edit-measure-dialog',
  templateUrl: './edit-measure-dialog.component.html',
  styleUrls: ['./edit-measure-dialog.component.scss'],
})
export class EditMeasureDialogComponent implements OnInit {
  visualizationChoices = {
    Value: 'success-modeling.edit-measure-dialog.choice-value',
    Chart: 'success-modeling.edit-measure-dialog.choice-chart',
    KPI: 'success-modeling.edit-measure-dialog.choice-kpi',
  };

  chartTypeChoices = {
    LineChart:
      'success-modeling.edit-measure-dialog.choice-linechart',
    PieChart: 'success-modeling.edit-measure-dialog.choice-piechart',
    BarChart: 'success-modeling.edit-measure-dialog.choice-barchart',
    RadarChart:
      'success-modeling.edit-measure-dialog.choice-radarchart',
  };

  visualizationBuffer = {
    Value: new ValueVisualization(''),
    Chart: new ChartVisualization(
      null,
      'chartNode',
      'chart title',
      '300',
      '300',
    ),
    KPI: new KpiVisualization([new KpiVisualizationOperand('', 0)]),
  };
  constructor(
    private dialogRef: MatDialogRef<EditMeasureDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private ngrxStore: Store,
  ) {}

  ngOnInit(): void {}

  onVisualizationChange(visualizationType: string): void {
    if (
      this.data.measure.visualization &&
      this.data.measure.visualization.type
    ) {
      this.visualizationBuffer[this.data.measure.visualization.type] =
        this.data.measure.visualization;
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.data.measure.visualization =
      this.visualizationBuffer[visualizationType];
  }

  onAddQueryClicked(): void {
    this.data.measure.queries.push(new Query('', ''));
  }

  onRemoveQueryClicked(): void {
    this.data.measure.queries.pop();
  }

  onKpiOperandChange(operandName: string, index: number): void {
    (
      this.data.measure.visualization as KpiVisualization
    ).operationsElements[index] = new KpiVisualizationOperand(
      operandName,
      index,
    );
  }

  onKpiOperatorChange(operatorName: string, index: number): void {
    (
      this.data.measure.visualization as KpiVisualization
    ).operationsElements[index] = new KpiVisualizationOperator(
      operatorName,
      index,
    );
  }

  onAddOperationClicked(): void {
    const kpiVisualization = this.data.measure
      .visualization as KpiVisualization;
    kpiVisualization.operationsElements.push(
      new KpiVisualizationOperator(
        '',
        kpiVisualization.operationsElements.length,
      ),
    );
    kpiVisualization.operationsElements.push(
      new KpiVisualizationOperand(
        '',
        kpiVisualization.operationsElements.length,
      ),
    );
  }

  onRemoveOperationClicked(): void {
    const kpiVisualization = this.data.measure
      .visualization as KpiVisualization;
    if (kpiVisualization.operationsElements.length >= 3) {
      kpiVisualization.operationsElements.pop();
      kpiVisualization.operationsElements.pop();
    }
  }

  onQueryNameChanged(value: string, i: number): void {
    const currentName = this.data.measure.queries[i].name;
    const visualizationType = this.data.measure.visualization.type;
    if (visualizationType === 'KPI') {
      const visualization = this.data.measure
        .visualization as KpiVisualization;
      visualization.operationsElements.forEach((opElement, index) => {
        if (index % 2 === 0 && opElement.name === currentName) {
          opElement.name = value;
        }
      });
    }
    this.data.measure.queries[i].name = value;
  }
  onQueryChanged(sql: string): void {
    this.ngrxStore.dispatch(
      fetchVisualizationData({
        query: sql,
        queryParams: this.getParamsForQuery(sql),
      }),
    );
  }

  prettifyCustomMessageName(messageName: string): string {
    return messageName.replace(/_/g, ' ');
  }

  getParamsForQuery(query: string): string[] {
    if (
      !this.data.service ||
      this.data.service?.mobsosIDs?.length === 0
    ) {
      // just for robustness
      // should not be called when there are no service IDs stored in MobSOS anyway
      return [];
    }
    const serviceRegex = /\$SERVICE\$/g;
    const matches = query?.match(serviceRegex);
    const params = [];
    if (matches) {
      for (const match of matches) {
        // for now we just use the first ID
        // support for multiple IDs is not implemented yet
        params.push(this.data.service.mobsosIDs.slice(-1)[0].agentID);
      }
    }
    return params as string[];
  }
}
