import {
  Component,
  ElementRef,
  Inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
} from '@angular/material/dialog';
import { ServiceInformation } from 'src/app/models/service.model';
import { Measure, SQLQuery } from 'src/app/models/measure.model';
import {
  ChartVisualization,
  KpiVisualization,
  ValueVisualization,
} from 'src/app/models/visualization.model';
import { fetchVisualizationData } from 'src/app/services/store/store.actions';
import { Store } from '@ngrx/store';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Observable } from 'rxjs';
import {
  distinctUntilChanged,
  map,
  share,
  startWith,
} from 'rxjs/operators';
import { MathExpression } from 'mathjs';
import { expression } from 'mathjs';

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
  @ViewChild('Expression') expressionRef: ElementRef;

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
    KPI: new KpiVisualization(),
  };

  measureForm: FormGroup;
  measure$: Observable<Measure>;

  constructor(
    private dialogRef: MatDialogRef<EditMeasureDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private ngrxStore: Store,
    private fb: FormBuilder,
  ) {
    const measure = this.data.measure;
    this.measureForm = this.fb.group(
      {
        // eslint-disable-next-line @typescript-eslint/unbound-method
        name: [measure.name, Validators.required],
        description: [measure.description, Validators.maxLength(500)],
        visualization: this.fb.group({
          type: measure.visualization.type,
          parameters: this.fb.array([]), // parameters are specific for each visualization type and thus populated dynamically
        }),
        queries: this.fb.array([], { updateOn: 'blur' }),
      },
      { updateOn: 'blur' },
    );
    // queries are dynamically added to the form
    measure.queries.forEach((q) =>
      this.formQueries.push(
        this.fb.group({
          name: [q.name],
          sql: [
            EditMeasureDialogComponent.replaceXMLEncodings(q.sql),
          ],
        }),
      ),
    );
    switch (measure.visualization.type) {
      case 'Chart':
        this.buildParamsForChart(
          (measure.visualization as ChartVisualization).chartType,
        );
        break;
      case 'Value':
        this.buildParamsForValue(
          (measure.visualization as ValueVisualization).unit,
        );
        break;
      case 'KPI':
        this.buildParamsForKPI(
          (measure.visualization as KpiVisualization).expression,
        );
        break;
    }
  }

  get formVisualizationParameters(): FormArray {
    return this.measureForm.get(
      'visualization.parameters',
    ) as FormArray;
  }

  get formQueries(): FormArray {
    return this.measureForm.get('queries') as FormArray;
  }

  get queryNames(): string[] {
    return this.formQueries.value.map((q) => q.name);
  }

  get KPIExpression() {
    if (
      this.measureForm.get('visualization').get('type').value !==
      'KPI'
    ) {
      return;
    }
    return this.measureForm
      .get('visualization')
      .get('parameters')
      .get('0')
      .get('expression');
  }

  private static encodeXML(sql: string): string {
    sql = sql.replace(/>/g, '&gt;');
    sql = sql.replace(/</g, '&lt;');
    return sql;
  }

  private static replaceXMLEncodings(sql: string) {
    sql = sql.replace(/&gt;/g, '>');
    sql = sql.replace(/&lt;/g, '<');
    return sql;
  }

  private static getMeasureFromForm(value: any): Measure {
    const measure = value as Measure;
    measure.queries = measure.queries.map((q) =>
      SQLQuery.fromJSON({
        ...q,
        sql: EditMeasureDialogComponent.encodeXML(q.sql),
      }),
    );

    switch (measure.visualization.type) {
      case 'Value':
        const unit = value.visualization.parameters
          ? value.visualization.parameters[0].unit
          : value.visualization.unit;
        measure.visualization = new ValueVisualization(
          unit as string,
        );
        break;
      case 'Chart':
        const chartType = value.visualization.parameters
          ? value.visualization.parameters[0].chartType
          : value.visualization.chartType;
        measure.visualization = new ChartVisualization(
          chartType as string,
        );
        break;
      case 'KPI':
        const expression = value.visualization.parameters;
        measure.visualization =
          KpiVisualization.fromPlainObject(expression);
        break;
    }
    return measure;
  }

  insertIntoExpression(val: string) {
    const el = this.expressionRef.nativeElement;
    const [start, end] = [el.selectionStart, el.selectionEnd];
    el.setRangeText(val, start, end, 'select');
    el.selectionStart = el.selectionEnd = el.selectionStart + 1;
    el.focus();
  }

  /**
   * Transforms the value of a form into a Success Measure object.
   *
   * @param value the value of the form
   * @returns corresponding success measure object
   */

  controlsForFirstStepInValid(): boolean {
    if (
      this.measureForm.get('visualization').get('type').value ===
      'KPI'
    ) {
      return (
        !this.expressionVariablesAreDefined() ||
        this.measureForm.get('name').invalid ||
        this.measureForm.get('description').invalid ||
        this.measureForm.get('visualization').invalid
      );
    } else {
      return (
        this.measureForm.get('name').invalid ||
        this.measureForm.get('description').invalid ||
        this.measureForm.get('visualization').invalid
      );
    }
  }

  /**
   * Function which checks that each variable in the expression string is defined in a query
   * @returns
   */
  expressionVariablesAreDefined(): boolean {
    const expressions = this.KPIExpression?.value.match(/\b(\w+)\b/g);
    if (!expressions) return true;
    return expressions?.every((expression) =>
      this.queryNames.includes(expression),
    );
  }

  controlsForSecondStepInValid(): boolean {
    return this.measureForm.get('queries').invalid;
  }

  ngOnInit(): void {
    this.measure$ = this.measureForm.valueChanges.pipe(
      startWith(this.data.measure),
      distinctUntilChanged(
        (
          prev: { queries: SQLQuery[] },
          curr: { queries: SQLQuery[] },
        ) => {
          return queriesChanged(prev, curr);
        },
      ),
      map((value) =>
        EditMeasureDialogComponent.getMeasureFromForm(
          value ? value : this.data.measure,
        ),
      ),
      share(),
    );
  }

  onVisualizationChange(visualizationType: string): void {
    this.measureForm
      .get('visualization.type')
      .setValue(visualizationType);
    switch (visualizationType) {
      case 'KPI':
        this.buildParamsForKPI();
        break;
      case 'Value':
        this.buildParamsForValue();
        break;
      case 'Chart':
        this.buildParamsForChart();
        break;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.data.measure.visualization =
      this.visualizationBuffer[visualizationType];
  }

  onSubmit(): void {
    if (!this.measureForm.valid) {
      return; // should not happen because submit button is disabled if form is invalid
    }

    const measure = EditMeasureDialogComponent.getMeasureFromForm(
      this.measureForm.value,
    );

    this.dialogRef.close(measure);
  }

  onAddQueryClicked(): void {
    this.formQueries.push(this.fb.group({ name: [''], sql: [''] }));
    // this.data.measure.queries.push(new Query('', ''));
  }

  onRemoveQueryClicked(): void {
    this.formQueries.removeAt(this.formQueries.length - 1);
    // this.data.measure.queries.pop();
  }

  // onKpiOperandChange(operandName: string, index: number): void {
  //   (
  //     this.data.measure.visualization as KpiVisualization
  //   ).operationsElements[index] = new KpiVisualizationOperand(
  //     operandName,
  //     index,
  //   );
  // }

  // onKpiOperatorChange(operatorName: string, index: number): void {
  //   (
  //     this.data.measure.visualization as KpiVisualization
  //   ).operationsElements[index] = new KpiVisualizationOperator(
  //     operatorName,
  //     index,
  //   );
  //   this.formVisualizationParameters.push(new FormControl(''));
  // }

  // onAddOperationClicked(): void {
  //   this.formVisualizationParameters.push(new FormControl(''));

  //   if (this.formVisualizationParameters.controls.length === 1) {
  //     this.formVisualizationParameters.push(new FormControl(''));
  //   }
  // }

  // onRemoveOperationClicked(): void {
  //   const kpiVisualization = this.data.measure
  //     .visualization as KpiVisualization;
  //   if (kpiVisualization.operationsElements.length >= 3) {
  //     kpiVisualization.operationsElements.pop();
  //     kpiVisualization.operationsElements.pop();
  //   }

  //   if (this.formVisualizationParameters.controls.length > 2) {
  //     this.formVisualizationParameters.removeAt(
  //       this.formVisualizationParameters.length - 1,
  //     );
  //     this.formVisualizationParameters.removeAt(
  //       this.formVisualizationParameters.length - 1,
  //     );
  //   }
  // }

  // onQueryNameChanged(value: string, i: number): void {
  //   const currentName = this.data.measure.queries[i].name;
  //   const visualizationType = this.data.measure.visualization.type;
  //   if (visualizationType === 'KPI') {
  //     const visualization = this.data.measure
  //       .visualization as KpiVisualization;
  //     visualization.operationsElements.forEach((opElement, index) => {
  //       if (index % 2 === 0 && opElement.name === currentName) {
  //         opElement.name = value;
  //       }
  //     });
  //   }
  //   this.data.measure.queries[i].name = value;
  // }
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

  getParamsForQuery(q: string): string[] {
    if (
      !this.data.service ||
      this.data.service?.mobsosIDs?.length === 0
    ) {
      // just for robustness
      // should not be called when there are no service IDs stored in MobSOS anyway
      return [];
    }
    const serviceRegex = /\$SERVICE\$/g;
    const matches = q?.match(serviceRegex);
    const params = [];
    if (matches) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for (const match of matches) {
        // for now we use the id which has the greatest registrationTime as this is the agent ID of the most recent service agent started in las2peer
        const maxIndex = Object.values(
          this.data.service.mobsosIDs,
        ).reduce((max, time, index) => {
          return time > max ? index : max;
        }, 0);

        params.push(
          Object.keys(this.data.service.mobsosIDs)[maxIndex],
        );
      }
    }
    return params as string[];
  }

  private buildParamsForChart(chartType?: string): void {
    this.formVisualizationParameters.clear();
    this.formVisualizationParameters.push(
      this.fb.group({
        chartType: [chartType || ''],
      }),
    );
  }
  private buildParamsForValue(unit?: string): void {
    this.formVisualizationParameters.clear();
    this.formVisualizationParameters.push(
      this.fb.group({
        unit: [unit || ''],
      }),
    );
  }
  private buildParamsForKPI(expression?: MathExpression): void {
    this.formVisualizationParameters.clear();
    this.formVisualizationParameters.push(
      this.fb.group({ expression: [expression?.toString() || ''] }),
    );
  }
}
function queriesChanged(
  prev: { queries: SQLQuery[] },
  curr: { queries: SQLQuery[] },
): boolean {
  if (prev.queries.length !== curr.queries.length) {
    return true;
  }
  for (let i = 0; i < prev.queries.length; i++) {
    if (prev.queries[i].name !== curr.queries[i].name) {
      return true;
    }
    if (prev.queries[i].sql !== curr.queries[i].sql) {
      return true;
    }
  }
  return false;
}
