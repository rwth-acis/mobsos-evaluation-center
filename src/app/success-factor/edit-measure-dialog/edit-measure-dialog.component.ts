import { Component, Inject, OnInit, ViewChild } from '@angular/core';
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

export interface DialogData {
  measure: Measure;
  service: ServiceInformation;
  create: boolean;
}

@Component({
  selector: 'app-edit-measure-dialog',
  templateUrl: './edit-measure-dialog.component.html',
  styleUrls: ['./edit-measure-dialog.component.scss'],
})
export class EditMeasureDialogComponent implements OnInit {
  @ViewChild('previewMeasure') public previewMeasure;
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
  ) {}

  ngOnInit() {}

  onVisualizationChange(visualizationType: string) {
    if (
      this.data.measure.visualization &&
      this.data.measure.visualization.type
    ) {
      this.visualizationBuffer[this.data.measure.visualization.type] =
        this.data.measure.visualization;
    }
    this.data.measure.visualization =
      this.visualizationBuffer[visualizationType];
    this.previewMeasure.refreshVisualization();
  }

  onAddQueryClicked() {
    this.data.measure.queries.push(new Query('', ''));
  }

  onRemoveQueryClicked() {
    this.data.measure.queries.pop();
  }

  onKpiOperandChange(operandName: string, index: number) {
    (
      this.data.measure.visualization as KpiVisualization
    ).operationsElements[index] = new KpiVisualizationOperand(
      operandName,
      index,
    );
    this.previewMeasure.rerenderVisualizationComponent();
  }

  onKpiOperatorChange(operatorName: string, index: number) {
    (
      this.data.measure.visualization as KpiVisualization
    ).operationsElements[index] = new KpiVisualizationOperator(
      operatorName,
      index,
    );
    this.previewMeasure.rerenderVisualizationComponent();
  }

  onAddOperationClicked() {
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

  onRemoveOperationClicked() {
    const kpiVisualization = this.data.measure
      .visualization as KpiVisualization;
    if (kpiVisualization.operationsElements.length >= 3) {
      kpiVisualization.operationsElements.pop();
      kpiVisualization.operationsElements.pop();
    }
    this.previewMeasure.rerenderVisualizationComponent();
  }

  onQueryNameChanged(value: string, i: number) {
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
    this.previewMeasure.rerenderVisualizationComponent();
  }

  prettifyCustomMessageName(messageName: string) {
    return messageName.replace(/_/g, ' ');
  }
}
