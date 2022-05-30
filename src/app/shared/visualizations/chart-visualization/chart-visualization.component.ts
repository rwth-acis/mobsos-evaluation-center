/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import {
  ChartType,
  Formatter,
  getPackageForChart,
  ScriptLoaderService,
} from 'angular-google-charts';
import {
  applyCompatibilityFixForVisualizationService,
  VisualizationComponent,
} from '../visualization.component';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import {
  EXPERT_MODE,
  RESTRICTED_MODE,
  SELECTED_SERVICE,
  VISUALIZATION_DATA_FOR_QUERY,
} from 'src/app/services/store/store.selectors';
import {
  delayWhen,
  distinctUntilChanged,
  distinctUntilKeyChanged,
  filter,
  map,
  startWith,
  switchMap,
  withLatestFrom,
} from 'rxjs/operators';
import { Observable, Subscription } from 'rxjs';
import {
  ChartVisualization,
  VisualizationData,
  Visualization,
} from 'src/app/models/visualization.model';
import { ChartData } from 'src/app/models/chart.model';
import { refreshVisualization } from 'src/app/services/store/store.actions';
import { RawDataDialogComponent } from '../raw-data-dialog/raw-data-dialog.component';
import { Measure } from 'src/app/models/measure.model';
import { StaticChartComponent } from './static-chart/static-chart.component';

@Component({
  selector: 'app-chart-visualization',
  templateUrl: './chart-visualization.component.html',
  styleUrls: ['./chart-visualization.component.scss'],
})
export class ChartVisualizerComponent
  extends VisualizationComponent
  implements OnInit, OnDestroy
{
  @Input() override measure$: Observable<Measure>;

  @Output() override isLoading: EventEmitter<any> =
    new EventEmitter();

  chartData: ChartData; // data which is needed to build the chart.
  chartInitialized = false; // used for the fadein animation of charts
  data$: Observable<VisualizationData>; // visualization data fetched from the store
  dataIsReady$: Observable<boolean>; // Observable which is true when data is currently loading from the server
  formatter_medium; // holds the formatter for the date with format type medium
  formatters: Formatter[] = []; // formatters are used to format js dates into human readable format

  subscriptions$: Subscription[] = [];
  query$: Observable<string>; // Observable of the sql query
  expertMode$ = this.ngrxStore.select(EXPERT_MODE);
  restricted$ = this.ngrxStore.select(RESTRICTED_MODE);
  service$ = this.ngrxStore.select(SELECTED_SERVICE).pipe(
    filter((service) => !!service),
    distinctUntilKeyChanged('name'),
    startWith(undefined),
  );

  constructor(
    protected override dialog: MatDialog,
    private ngrxStore: Store,
    private scriptLoader: ScriptLoaderService,
  ) {
    super(dialog);
  }

  ngOnDestroy(): void {
    this.subscriptions$.forEach((subscription) =>
      subscription.unsubscribe(),
    );
  }

  override ngOnInit(): void {
    let sub = this.scriptLoader.loadChartPackages().subscribe(
      () =>
        (this.formatter_medium = new google.visualization.DateFormat({
          formatType: 'medium',
        })),
    );
    this.subscriptions$.push(sub);

    // gets the query string from the measure and applies variable replacements
    this.query$ = this.measure$.pipe(
      withLatestFrom(this.service$),
      map(([measure, service]) =>
        applyCompatibilityFixForVisualizationService(
          super.applyVariableReplacements(
            measure.queries[0].sql,
            service,
          ),
        ),
      ),
      filter((query) => !!query),
      distinctUntilChanged(),
    );

    // selects the query data for the query from the store
    this.data$ = this.query$.pipe(
      switchMap((queryString) =>
        this.ngrxStore
          .select(VISUALIZATION_DATA_FOR_QUERY({ queryString }))
          .pipe(
            filter((data) => !!data),
            distinctUntilKeyChanged('fetchDate'),
          ),
      ),
      startWith({
        data: undefined,
        loading: true,
        fetchDate: undefined,
      }),
      filter((data) => !!data),
      distinctUntilKeyChanged('fetchDate'),
    );

    this.error$ = this.data$.pipe(map((data) => data?.error));

    this.dataIsReady$ = this.data$.pipe(
      map((data) => data && !data.loading),
      distinctUntilChanged(),
    );

    // loads the package for the charttype and emits if package is loaded
    const chartLibReady$ = this.measure$.pipe(
      map(
        (measure) =>
          (measure.visualization as ChartVisualization).chartType,
      ),
      switchMap((chartType) => {
        const type = getPackageForChart(
          ChartType[chartType] as ChartType,
        );
        return this.scriptLoader.loadChartPackages(type);
      }),
    );

    sub = this.measure$
      .pipe(withLatestFrom(this.service$))
      .subscribe(([measure, service]) => {
        let query = measure.queries[0].sql;
        const cache = !this.measure?.tags.includes('generated'); // dont cache results for generated measures
        const queryParams = super.getParamsForQuery(query);
        query = this.applyVariableReplacements(query, service);
        query = applyCompatibilityFixForVisualizationService(query);
        super.fetchVisualizationData(
          query,
          queryParams,
          this.ngrxStore,
          cache,
        );
      });
    this.subscriptions$.push(sub);

    sub = this.data$
      .pipe(
        map((vdata) => vdata?.data),
        filter(
          (data) =>
            data !== undefined &&
            data instanceof Array &&
            data.length >= 2,
        ),
        withLatestFrom(this.measure$),
        delayWhen(() => chartLibReady$),
      )
      .subscribe(([dataTable, measure]) => {
        this.prepareChart(dataTable, measure.visualization);
      });
    this.subscriptions$.push(sub);
    this.dataIsReady$.pipe(startWith(false)).subscribe((ready) => {
      this.isLoading.emit(!ready);
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
        queryParams: super.getParamsForQuery(query),
      }),
    );
    this.chartData = null;
    this.chartInitialized = false;
  }

  expandChart(): void {
    this.dialog.open(StaticChartComponent, {
      data: this.chartData,
      width: '90vw',
      height: '90vh',
    });
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
    this.chartInitialized = false;
    this.formatters = [];
    visualization = visualization as ChartVisualization;

    const labelTypes = dataTable[1];
    let rows = dataTable.slice(2) || [];

    for (let i = 0; i < labelTypes.length; i++) {
      if (labelTypes[i] === 'datetime' || labelTypes[i] === 'date') {
        this.formatters.push({
          formatter: this.formatter_medium,
          colIndex: i,
        });
        rows = rows.map((row) =>
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          row.map((entry: string, index) => {
            if (index === i) {
              return new Date(parseInt(entry, 10));
            }
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            return entry;
          }),
        );
      }
    }

    this.chartData = new ChartData(
      '',
      (visualization as ChartVisualization).chartType,
      rows,
      dataTable[0] as string[],
      {
        colors: [
          '#00a895',
          '#9500a8',
          '#a89500',
          '#ff5252',
          '#ffd600',
        ],
      },
      this.formatters,
    );
  }
}
