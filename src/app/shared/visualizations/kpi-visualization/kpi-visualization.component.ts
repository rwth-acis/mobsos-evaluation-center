import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import {
  applyCompatibilityFixForVisualizationService,
  VisualizationComponent,
} from '../visualization.component';
import { MatDialog } from '@angular/material/dialog';

import { Store } from '@ngrx/store';
import {
  RESTRICTED_MODE,
  SELECTED_SERVICE,
  VISUALIZATION_DATA_FOR_QUERY,
} from 'src/app/services/store/store.selectors';
import { combineLatest, Observable, Subscription } from 'rxjs';
import {
  Measure,
  Query,
  SQLQuery,
} from 'src/app/models/measure.model';
import {
  KpiVisualization,
  VisualizationData,
} from 'src/app/models/visualization.model';
import {
  catchError,
  distinctUntilChanged,
  distinctUntilKeyChanged,
  filter,
  first,
  map,
  shareReplay,
  startWith,
  switchMap,
  tap,
  withLatestFrom,
} from 'rxjs/operators';
import { refreshVisualization } from 'src/app/services/store/store.actions';
import { MathExpression } from 'mathjs';

@Component({
  selector: 'app-kpi-visualization',
  templateUrl: './kpi-visualization.component.html',
  styleUrls: ['./kpi-visualization.component.scss'],
})
export class KpiVisualizationComponent
  extends VisualizationComponent
  implements OnInit, OnDestroy
{
  @Input() override data$: Observable<VisualizationData[]>;
  @Input() override visualization$: Observable<KpiVisualization>;
  @Input() queries$: Observable<SQLQuery[]>;
  @Input() description$: Observable<string>;
  dataIsLoading$: Observable<boolean>;
  kpi$: Observable<{ abstractTerm: string[]; term: string[] }>;
  fetchDate$: Observable<string>; // latest fetch date as iso string
  expression$: Observable<MathExpression>;
  scope$: Observable<{
    [key: string]: number;
  }>;
  restricted$ = this.ngrxStore.select(RESTRICTED_MODE);
  service$ = this.ngrxStore.select(SELECTED_SERVICE).pipe(
    filter((service) => !!service),
    distinctUntilKeyChanged('name'),
    startWith(undefined),
  );
  private subscriptions$: Subscription[] = [];
  constructor(
    protected override dialog: MatDialog,
    private ngrxStore: Store,
    private cdref: ChangeDetectorRef,
  ) {
    super(dialog);
  }

  ngOnDestroy(): void {
    this.subscriptions$.forEach((subscription) =>
      subscription.unsubscribe(),
    );
  }

  override ngOnInit(): void {
    this.fetchDate$ = this.data$.pipe(
      filter((data) => !!data),
      map((data) => data.map((entry) => new Date(entry.fetchDate))), // map each entry onto its fetch date
      map((dates) =>
        dates.reduce((max, curr) =>
          curr.getTime() > max.getTime() ? curr : max,
        ),
      ), // take the latest fetch date
      map((timestamp) => timestamp.toISOString()), // convert to iso string
    );

    // true if any query is still loading
    this.dataIsLoading$ = this.data$.pipe(
      map(
        (data: VisualizationData[]) =>
          data === undefined ||
          data.some((v) => v === null) ||
          data.some((v) => v.loading),
      ),
      distinctUntilChanged(),
    );

    // if any vdata has an erorr then error observable will contain the first error which occurred
    this.error$ = this.data$.pipe(
      map((data) => data.find((vdata) => !!vdata.error)?.error),
    );

    this.expression$ = this.visualization$.pipe(
      map((viz) => viz.expression),
      shareReplay(1),
    );

    this.scope$ = this.data$.pipe(
      filter((data) => allDataLoaded(data)),
      map((data) => data.map((vdata) => vdata.data)), // map each vdata onto the actual data
      map((data) => data.map((d) => d[2][0])), // map each data onto the actual data
      withLatestFrom(this.queries$),
      map(([data, queries]) =>
        queries.reduce(
          (acc, query, i) => (acc[query.name] = data[i]),
          {},
        ),
      ),
      shareReplay(1),
    );
  }

  onRefreshClicked(queries: SQLQuery[]): void {
    queries
      .map((query) => query.sql)
      .forEach((query) => {
        this.ngrxStore.dispatch(
          refreshVisualization({
            query,
          }),
        );
      });
  }
}

function allDataLoaded(data: VisualizationData[]): boolean {
  if (!data) return false;

  return (
    !data.some((v) => v.data === null) &&
    !data.some((vdata) => vdata.error) &&
    !data.some((vdata) => vdata.loading)
  );
}
