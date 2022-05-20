import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ChartType } from 'angular-google-charts';
import { combineLatest } from 'rxjs';
import {
  distinctUntilChanged,
  filter,
  map,
  startWith,
} from 'rxjs/operators';
import { Measure, SQLQuery } from 'src/app/models/measure.model';
import {
  ChartVisualization,
  ValueVisualization,
  KpiVisualization,
  Visualization,
} from 'src/app/models/visualization.model';

@Component({
  selector: 'app-query-visualization',
  templateUrl: './query-visualization.component.html',
  styleUrls: ['./query-visualization.component.scss'],
})
export class QueryVisualizationComponent {
  static initialValue = 'SELECT ID, REMARKS FROM MESSAGE limit 10';
  visualizationChoices = [
    {
      label: 'success-modeling.edit-measure-dialog.choice-table',
      value: 'Table',
    },
    {
      label: 'success-modeling.edit-measure-dialog.choice-value',
      value: 'Value',
    },
    {
      label: 'success-modeling.edit-measure-dialog.choice-chart',
      value: 'Chart',
    },
    {
      label: 'success-modeling.edit-measure-dialog.choice-kpi',
      value: 'KPI',
    },
  ];

  chartTypeChoices = {
    LineChart:
      'success-modeling.edit-measure-dialog.choice-linechart',
    PieChart: 'success-modeling.edit-measure-dialog.choice-piechart',
    BarChart: 'success-modeling.edit-measure-dialog.choice-barchart',
    RadarChart:
      'success-modeling.edit-measure-dialog.choice-radarchart',
  };

  form = this.fb.group(
    {
      query: [QueryVisualizationComponent.initialValue],
      visualization: [this.visualizationChoices[0].value],
      chartType: ['BarChart'],
    },
    { updateOn: 'blur' },
  );

  selectedVisualizationType$ = this.form
    .get('visualization')
    .valueChanges.pipe(
      startWith(this.form.get('visualization').value),
      distinctUntilChanged(),
    );

  selectedChartType$ = this.form
    .get('chartType')
    .valueChanges.pipe(startWith(this.form.get('chartType').value));

  queryInput$ = this.form
    .get('query')
    .valueChanges.pipe(
      startWith(QueryVisualizationComponent.initialValue),
      distinctUntilChanged(),
    );

  measure$ = combineLatest([
    this.queryInput$,
    this.selectedVisualizationType$,
    this.selectedChartType$,
  ]).pipe(
    filter(([, visualizationType]) => visualizationType !== 'Table'),
    map(([query, visualizationType, chartType]) => {
      let visualization: Visualization;
      switch (visualizationType) {
        case 'Chart':
          visualization = new ChartVisualization(
            ChartType[chartType],
          );
          break;
        case 'Value':
          visualization = new ValueVisualization();
          break;
        case 'KPI':
          visualization = new KpiVisualization();
          break;
      }

      return new Measure(
        '',
        [new SQLQuery('', query as string)],
        visualization,
        [],
      );
    }),
  );

  constructor(private fb: FormBuilder) {}

  onSubmit() {
    this.form.markAsTouched();
  }
}
