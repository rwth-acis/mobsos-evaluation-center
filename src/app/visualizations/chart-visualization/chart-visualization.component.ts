import { Component, Input, OnInit } from '@angular/core';
import { BaseVisualizationComponent } from '../visualization.component';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import {
  MEASURE,
  VISUALIZATION_DATA_FOR_QUERY,
} from 'src/app/services/store.selectors';
import { distinctUntilChanged, filter, tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { Measure } from 'src/app/models/measure.model';
import {
  ChartVisualization,
  VData,
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
  @Input() service: ServiceInformation;

  data$: Observable<VData>;
  measure$: Observable<Measure>;
  query: string; // local copy of the sql query
  chart: GoogleChart;

  constructor(
    protected dialog: MatDialog,
    protected ngrxStore: Store,
  ) {
    super(ngrxStore, dialog);
  }

  ngOnInit() {
    this.service$
      .pipe(filter((service) => !!service))
      .subscribe((service) => {
        this.service = service;
        this.measure$ = this.ngrxStore
          .select(MEASURE, this.measureName) // selects the measure from the measure catalog
          .pipe(
            filter((data) => !!data),
            distinctUntilChanged(),
          );
        this.measure$.subscribe((measure: Measure) => {
          this.prepareChart(measure);
        });
      });
  }

  /**
   * Prepares chart for given measure
   * @param measure
   */
  private prepareChart(measure: Measure) {
    const visualization = measure.visualization as ChartVisualization;
    let query = measure.queries[0].sql;
    const queryParams = this.getParamsForQuery(query);

    query = this.applyVariableReplacements(query, this.service);
    query =
      BaseVisualizationComponent.applyCompatibilityFixForVisualizationService(
        query,
      );

    if (this.query !== query) {
      this.visualizationInitialized = false;
      this.query = query;
      super.fetchVisualizationData(query, queryParams);
      this.data$ = this.ngrxStore.select(
        VISUALIZATION_DATA_FOR_QUERY,
        query,
      );
      this.data$
        .pipe(
          tap((data) => (this.error = data?.error)),
          filter((data) => !!data && !data.error),
        )
        .subscribe((vdata) => {
          if (vdata.error) {
            this.error = vdata.error;
            return;
          }
          const dataTable = vdata.data;
          if (dataTable instanceof Array && dataTable.length >= 2) {
            const labelTypes = dataTable[1];
            const rows = dataTable.slice(2) as any[][];
            this.chart = new GoogleChart(
              '',
              visualization.chartType,
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
            if (this.chart) this.visualizationInitialized = true;
          }
        });
    }
  }
}
