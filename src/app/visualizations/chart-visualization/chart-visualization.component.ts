/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  AfterViewInit,
  Component,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import {
  ChartType,
  getPackageForChart,
  ScriptLoaderService,
} from 'angular-google-charts';
import { BaseVisualizationComponent } from '../visualization.component';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import {
  EXPERT_MODE,
  MEASURE,
  RESTRICTED_MODE,
  VISUALIZATION_DATA_FOR_QUERY,
} from 'src/app/services/store.selectors';
import {
  distinctUntilChanged,
  distinctUntilKeyChanged,
  filter,
  first,
  map,
  mergeMap,
  takeWhile,
  tap,
  withLatestFrom,
} from 'rxjs/operators';
import { interval, Observable, Subscription } from 'rxjs';
import {
  ChartVisualization,
  VisualizationData,
  Visualization,
} from 'src/app/models/visualization.model';
import { GoogleChart } from 'src/app/models/chart.model';
import { refreshVisualization } from 'src/app/services/store.actions';
import { RawDataDialogComponent } from 'src/app/raw-data-dialog/raw-data-dialog.component';

@Component({
  selector: 'app-chart-visualization',
  templateUrl: './chart-visualization.component.html',
  styleUrls: ['./chart-visualization.component.scss'],
})
export class ChartVisualizerComponent
  extends BaseVisualizationComponent
  implements OnInit, OnDestroy, AfterViewInit
{
  @Input() measureName: string;

  query$: Observable<string>;
  expertMode$ = this.ngrxStore.select(EXPERT_MODE);

  query: string; // local copy of the sql query
  chartData: GoogleChart;
  chartInitialized = false;
  visualization: ChartVisualization;
  data$: Observable<VisualizationData>;
  googleChartsIsReady$ = interval(100).pipe(
    map(() => this.scriptLoader.isGoogleChartsAvailable()),
  );
  dataIsLoading$: Observable<boolean>;
  restricted$ = this.ngrxStore.select(RESTRICTED_MODE);

  formatters = [];

  subscriptions$: Subscription[] = [];
  constructor(
    protected dialog: MatDialog,
    protected ngrxStore: Store,
    private scriptLoader: ScriptLoaderService,
  ) {
    super(ngrxStore, dialog);
  }

  ngOnDestroy(): void {
    this.subscriptions$.forEach((subscription) =>
      subscription.unsubscribe(),
    );
  }

  ngOnInit(): void {
    // selects the measure from the measure catalog
    this.measure$ = this.ngrxStore
      .select(MEASURE, this.measureName)
      .pipe(
        filter((measure) => !!measure),
        distinctUntilKeyChanged('queries'),
      );

    // gets the query string from the measure and applies variable replacements
    this.query$ = this.measure$.pipe(
      withLatestFrom(this.service$),
      map(([measure, service]) => {
        let query = measure.queries[0].sql;
        query = this.applyVariableReplacements(query, service);
        query =
          BaseVisualizationComponent.applyCompatibilityFixForVisualizationService(
            query,
          );
        return query;
      }),
      distinctUntilChanged(),
    );

    // selects the query data for the query from the store
    this.data$ = this.query$.pipe(
      filter((query) => !!query),
      mergeMap((query) =>
        this.ngrxStore.select(VISUALIZATION_DATA_FOR_QUERY, query),
      ),
    );
    this.error$ = this.data$.pipe(map((data) => data?.error));
    let sub = this.error$.subscribe((err) => {
      this.error = err;
    });
    this.dataIsLoading$ = this.data$.pipe(
      map((data) => data === undefined || data?.loading),
    );
    this.subscriptions$.push(sub);

    sub = this.measure$
      .pipe(
        map(
          (measure) =>
            (measure.visualization as ChartVisualization).chartType,
        ),
      )
      .subscribe((chartType) => {
        const type = getPackageForChart(ChartType[chartType]);
        this.scriptLoader.loadChartPackages(type);
      });
    this.subscriptions$.push(sub);

    sub = this.measure$
      .pipe(withLatestFrom(this.service$))
      .subscribe(([measure, service]) => {
        let query = measure.queries[0].sql;
        const queryParams = this.getParamsForQuery(query);
        query = this.applyVariableReplacements(query, service);
        query =
          BaseVisualizationComponent.applyCompatibilityFixForVisualizationService(
            query,
          );
        super.fetchVisualizationData(query, queryParams);
      });
    this.subscriptions$.push(sub);
  }

  ngAfterViewInit() {
    const sub = this.data$
      .pipe(
        map((vdata) => vdata?.data),
        filter((data) => data instanceof Array && data.length >= 2),
        withLatestFrom(this.measure$, this.googleChartsIsReady$),
        filter(([dataTable, measure, ready]) => ready),
      )
      .subscribe(([dataTable, measure]) => {
        this.prepareChart(dataTable, measure.visualization);
      });
    this.subscriptions$.push(sub);
  }

  fadeInAnimation(): string {
    if (this.chartInitialized) {
      return 'opacity: 1;transition: opacity 1s ease-out;';
    } else {
      return 'opacity: 0;';
    }
  }

  openRawDataDialog(data: any[][]): void {
    this.dialog.open(RawDataDialogComponent, {
      data,
    });
  }

  onRefreshClicked(query: string): void {
    this.ngrxStore.dispatch(
      refreshVisualization({
        query,
        queryParams: this.getParamsForQuery(query),
      }),
    );
  }

  /**
   * Prepares chart for given measure
   *
   * @param measure success measure
   *
   */
  private prepareChart(
    dataTable: any[][],
    visualization: Visualization,
  ) {
    this.formatters = [];
    visualization = visualization as ChartVisualization;
    this.error = null;
    const labelTypes = dataTable[1];
    for (let i = 0; i < labelTypes.length; i++) {
      if (labelTypes[i] === 'datetime' || labelTypes[i] === 'date') {
        this.formatters.push({
          formatter: new google.visualization.DateFormat({
            formatType: 'long',
          }),
          colIndex: i,
        });
      }
    }

    const rows = dataTable.slice(2);

    this.chartData = new GoogleChart(
      '',
      (visualization as ChartVisualization).chartType,
      rows,
      dataTable[0],
      {
        colors: [
          '#00a895',
          '#9500a8',
          '#a89500',
          '#ff5252',
          '#ffd600',
        ],
        animation: { startup: true },
      },
    );
    // if (this.chartData) this.visualizationInitialized = true;
  }
}
