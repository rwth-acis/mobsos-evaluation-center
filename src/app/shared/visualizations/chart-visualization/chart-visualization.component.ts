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
  shareReplay,
  startWith,
  switchMap,
  tap,
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
import { IMeasure, Measure } from 'src/app/models/measure.model';
import { StaticChartComponent } from './static-chart/static-chart.component';
import { HttpErrorResponse } from '@angular/common/http';
import { ErrorDialogComponent } from '../error-dialog/error-dialog.component';

@Component({
  selector: 'app-chart-visualization',
  templateUrl: './chart-visualization.component.html',
  styleUrls: ['./chart-visualization.component.scss'],
})
export class ChartVisualizerComponent implements OnInit, OnDestroy {
  // @Input() override measure$: Observable<IMeasure>;
  @Input() data$: Observable<VisualizationData>;
  @Input() visualization$: Observable<ChartVisualization>;
  // @Output() override isLoading: EventEmitter<any> =
  //   new EventEmitter();

  chartData: ChartData; // data which is needed to build the chart.
  chartInitialized = false; // used for the fadein animation of charts

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
  error$: Observable<HttpErrorResponse>;

  constructor(
    private dialog: MatDialog,
    private ngrxStore: Store,
    private scriptLoader: ScriptLoaderService,
  ) {}

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

    this.error$ = this.data$.pipe(map((data) => data?.error));

    this.dataIsReady$ = this.data$.pipe(
      map((data) => data && !data.loading),
      distinctUntilChanged(),
      shareReplay(1),
    );

    // loads the package for the charttype and emits if package is loaded
    const chartLibReady$ = this.visualization$.pipe(
      map((viz) => viz.chartType),
      switchMap((chartType) => {
        const type = getPackageForChart(
          ChartType[chartType] as ChartType,
        );
        return this.scriptLoader.loadChartPackages(type);
      }),
    );

    sub = this.data$
      .pipe(
        map((vdata) => vdata?.data),
        filter(
          (data) =>
            data !== undefined &&
            data instanceof Array &&
            data.length >= 2,
        ),
        withLatestFrom(this.visualization$),
        delayWhen(() => chartLibReady$),
      )
      .subscribe(([dataTable, visualization]) => {
        this.prepareChart(dataTable, visualization);
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

  openErrorDialog(
    error?: HttpErrorResponse | { error: SyntaxError } | string,
  ): void {
    let errorText = 'Unknown error';
    if (error instanceof HttpErrorResponse) {
      errorText =
        'Http status code: ' + error.status?.toString() + '\n';
      errorText += error.statusText;
      if (typeof error.error === 'string') {
        errorText += ': ' + error.error;
      }
    } else if (
      typeof error === 'object' &&
      Object.keys(error).includes('error')
    ) {
      errorText = (error as { error: SyntaxError }).error.message;
    } else if (typeof error === 'string') {
      errorText = error;
    }
    errorText = errorText?.trim();
    this.dialog.open(ErrorDialogComponent, {
      width: '80%',
      data: { error: errorText },
    });
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
