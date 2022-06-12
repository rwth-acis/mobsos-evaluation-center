import { ChangeDetectorRef, Component,OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Store } from '@ngrx/store';
import { ChartType } from 'angular-google-charts';
import { combineLatest, of } from 'rxjs';
import {
  distinctUntilChanged,
  filter,
  map,
  shareReplay,
  startWith,
  switchMap,
  tap,
} from 'rxjs/operators';
import { Measure, SQLQuery } from 'src/app/models/measure.model';
import {
  ChartVisualization,
  ValueVisualization,
  KpiVisualization,
  Visualization,
} from 'src/app/models/visualization.model';
import { fetchVisualizationData } from 'src/app/services/store/store.actions';
import { VISUALIZATION_DATA_FOR_QUERY } from 'src/app/services/store/store.selectors';

@Component({
  selector: 'app-query-visualization',
  templateUrl: './query-visualization.component.html',
  styleUrls: ['./query-visualization.component.scss'],
})
export class QueryVisualizationComponent implements OnInit {
  static initialQuery = 'SELECT ID, REMARKS FROM MESSAGE limit 10';
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
      query: [QueryVisualizationComponent.initialQuery],
      visualization: [this.visualizationChoices[0].value],
      chartType: ['BarChart'],
    },
    { updateOn: 'blur' },
  );

  selectedVisualizationType$ = this.form
    .get('visualization')
    .valueChanges.pipe(startWith('Table'), shareReplay(1));

  selectedChartType$ = combineLatest([
    this.form.get('chartType').valueChanges,
    this.selectedVisualizationType$,
  ]).pipe(
    filter(([, visualizationType]) =>
      visualizationType === 'Chart' ? true : false,
    ),
    map(([chartType]) => chartType),
    distinctUntilChanged(),
    shareReplay(1),
  );

  queryInput$ = this.form
    .get('query')
    .valueChanges.pipe(
      startWith(QueryVisualizationComponent.initialQuery),
      distinctUntilChanged(),
    );

  measure$ = combineLatest([
    this.queryInput$.pipe(distinctUntilChanged()),
    this.selectedVisualizationType$.pipe(distinctUntilChanged()),
    this.selectedChartType$.pipe(
      startWith('BarChart'),
      distinctUntilChanged(),
    ),
  ]).pipe(
    filter(([, visualizationType]) => {
      return !!visualizationType && visualizationType !== 'Table';
    }),
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
    filter((m) => !!m),
    shareReplay(1),
  );

  dataIsLoading: boolean = true;
  queries$: any;
  description$: any;
  visualzation$: any;
  data$: any;
  subscriptions$: any;

  constructor(
    private fb: FormBuilder,
    private changeDetectorRef: ChangeDetectorRef,
    private ngrxStore: Store,
  ) {}

  setLoading(loading: boolean) {
    if (this.dataIsLoading !== loading) {
      this.dataIsLoading = loading;
      this.changeDetectorRef.detectChanges();
    }
  }

  ngOnInit() {
    this.queries$ = this.measure$.pipe(
      map((measure) => measure.queries),
    );
    this.description$ = this.measure$.pipe(
      map((measure) => measure.description),
    );

    this.visualzation$ = this.measure$.pipe(
      map((measure) => {
        switch (measure.visualization.type) {
          case 'Chart':
            return measure.visualization as ChartVisualization;
          case 'KPI':
            return measure.visualization as KpiVisualization;
          case 'Value':
            return measure.visualization as ValueVisualization;

          default:
            console.error(
              'Unknown visualization type: ' +
                measure.visualization.type,
            );
            return null;
        }
      }),
    );

    // retrieve all data for each query from the store
    this.data$ = this.measure$.pipe(
      map((measure) => Measure.fromJSON(measure as Measure).queries), // get all queries
      switchMap((queries) => {
        if (!queries || queries.length === 0) {
          return of(null);
        } else if (queries.length === 1) {
          return this.ngrxStore // case for value and chart
            .select(
              VISUALIZATION_DATA_FOR_QUERY({
                queryString: queries[0].sql,
              }),
            )
            .pipe(
              distinctUntilChanged(
                (prev, curr) => prev?.fetchDate === curr?.fetchDate,
              ),
              shareReplay(1),
            );
        } else {
          // case for kpi
          return combineLatest(
            queries.map((query) =>
              this.ngrxStore
                .select(
                  VISUALIZATION_DATA_FOR_QUERY({
                    queryString: query.sql,
                  }),
                )
                .pipe(
                  distinctUntilChanged(
                    (prev, curr) =>
                      prev?.fetchDate === curr?.fetchDate,
                  ),
                  shareReplay(1),
                ),
            ),
          );
        }
      }),
      shareReplay(1),
    );
    const sub = this.measure$
      .pipe(
        map((measure) => ({
          queries: Measure.fromJSON(measure as Measure).queries,
          cache: measure.tags?.includes('generated'),
        })),
      )
      .subscribe(({ queries, cache }) => {
        queries.forEach((query) => {
          this.ngrxStore.dispatch(
            fetchVisualizationData({ query: query.sql, cache }),
          );
        });
      });
    this.subscriptions$.push(sub);
  }

  onSubmit() {
    this.form.markAsTouched();
  }
}
