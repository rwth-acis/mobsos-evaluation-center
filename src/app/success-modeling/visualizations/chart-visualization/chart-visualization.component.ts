/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  AfterViewInit,
  Component,
  Inject,
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
  delayWhen,
  distinctUntilChanged,
  distinctUntilKeyChanged,
  filter,
  first,
  map,
  mergeMap,
  retry,
  sample,
  takeWhile,
  tap,
  timeout,
  withLatestFrom,
} from 'rxjs/operators';
import {
  combineLatest,
  interval,
  Observable,
  Subscription,
} from 'rxjs';
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

  query$: Observable<string>; // Observable of the sql query
  expertMode$ = this.ngrxStore.select(EXPERT_MODE);
  restricted$ = this.ngrxStore.select(RESTRICTED_MODE);

  formatter_medium; // holds the formatter for the date with format type medium

  chartData: GoogleChart; // data which is needed to build the chart.
  chartInitialized = false; // used for the fadein animation of charts
  data$: Observable<VisualizationData>; // visualization data fetched from the store
  googleChartsIsReady$ = interval(10).pipe(
    map(() => this.scriptLoader.isGoogleChartsAvailable()),
  ); // Observable which periodically checks wheter the google charts library is ready
  dataIsLoading$: Observable<boolean>; // Observable which is true when data is currently loading from the server

  formatters = []; // formatters are used to format js dates into human readable format

  subscriptions$: Subscription[] = [];
  constructor(
    public dialog: MatDialog,
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
    let sub = this.scriptLoader.loadChartPackages().subscribe(
      () =>
        (this.formatter_medium = new google.visualization.DateFormat({
          formatType: 'medium',
        })),
    );
    this.subscriptions$.push(sub);
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
      map(([measure, service]) =>
        BaseVisualizationComponent.applyCompatibilityFixForVisualizationService(
          this.applyVariableReplacements(
            measure.queries[0].sql,
            service,
          ),
        ),
      ),
      distinctUntilChanged(),
    );

    // selects the query data for the query from the store
    this.data$ = this.query$.pipe(
      mergeMap((query) =>
        this.ngrxStore.select(VISUALIZATION_DATA_FOR_QUERY, query),
      ),
    );

    this.error$ = this.data$.pipe(map((data) => data?.error));
    sub = this.error$.subscribe((err) => {
      this.error = err;
    });
    this.subscriptions$.push(sub);
    this.dataIsLoading$ = combineLatest([
      this.data$.pipe(
        map((data) => data === undefined || data?.loading),
      ),
      this.googleChartsIsReady$,
    ]).pipe(
      map(
        ([dataLoaded, chartLibLoaded]) =>
          chartLibLoaded && dataLoaded,
      ),
      timeout(5000),
    );

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
        distinctUntilChanged(),
        map((vdata) => vdata?.data),
        filter((data) => data instanceof Array && data.length >= 2),
        withLatestFrom(this.measure$),
        sample(this.scriptLoader.loadChartPackages()),
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
    let rows = dataTable.slice(2);
    for (let i = 0; i < labelTypes.length; i++) {
      if (labelTypes[i] === 'datetime' || labelTypes[i] === 'date') {
        this.formatters.push({
          formatter: this.formatter_medium,
          colIndex: i,
        });
        rows = rows.map((row) =>
          row.map((entry, index) => {
            if (index === i) {
              return new Date(parseInt(entry));
            }
            return entry;
          }),
        );
      }
    }

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
  }
}
