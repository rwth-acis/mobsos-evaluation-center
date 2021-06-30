import { Component, Input, OnInit } from '@angular/core';
import { BaseVisualizationComponent } from '../visualization.component';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import {
  MEASURE,
  VISUALIZATION_DATA_FOR_QUERY,
} from 'src/app/services/store.selectors';
import {
  distinctUntilChanged,
  distinctUntilKeyChanged,
  filter,
  first,
  map,
  switchMap,
  tap,
  throttleTime,
  withLatestFrom,
} from 'rxjs/operators';
import { Observable, Subscription } from 'rxjs';
import { Measure } from 'src/app/models/measure.model';
import {
  ChartVisualization,
  VData,
  Visualization,
  VisualizationData,
} from 'src/app/models/visualization.model';
import { GoogleChart } from 'src/app/models/chart.model';
import { ServiceInformation } from 'src/app/models/service.model';

@Component({
  selector: 'app-chart-visualization',
  templateUrl: './chart-visualization.component.html',
  styleUrls: ['./chart-visualization.component.scss'],
})
export class ChartVisualizerComponent
  extends BaseVisualizationComponent
  implements OnInit
{
  @Input() measureName: string;

  query$: Observable<string>;

  query: string; // local copy of the sql query
  chartData: GoogleChart;
  chartInitialized = false;
  visualization: ChartVisualization;

  subscriptions$: Subscription[] = [];
  constructor(
    protected dialog: MatDialog,
    protected ngrxStore: Store,
  ) {
    super(ngrxStore, dialog);
  }

  ngOnInit() {
    this.measure$ = this.ngrxStore
      .select(MEASURE, this.measureName) // selects the measure from the measure catalog
      .pipe(
        filter((measure) => !!measure),
        distinctUntilKeyChanged('queries'),
      );

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
    this.measure$
      .pipe(withLatestFrom(this.service$), first())
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
    this.data$ = this.query$.pipe(
      switchMap((query) =>
        this.ngrxStore.select(VISUALIZATION_DATA_FOR_QUERY, query),
      ),
    );
    const error$ = this.data$.pipe(map((data) => data?.error));
    let sub = error$.subscribe((err) => {
      this.error = err;
    });
    this.subscriptions$.push(sub);
    sub = this.data$
      .pipe(
        map((vdata) => vdata?.data),
        filter((data) => data instanceof Array && data.length >= 2),
        withLatestFrom(this.measure$),
      )
      .subscribe(([dataTable, measure]) => {
        this.prepareChart(dataTable, measure.visualization);
      });
    this.subscriptions$.push(sub);
  }

  /**
   * Prepares chart for given measure
   * @param measure success measure
   */
  private prepareChart(
    dataTable: any[][],
    visualization: Visualization,
  ) {
    visualization = visualization as ChartVisualization;
    this.error = null;
    const labelTypes = dataTable[1];
    const rows = dataTable.slice(2) as any[][];
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
