import {
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';

import { MatDialog } from '@angular/material/dialog';

import { Store } from '@ngrx/store';
import {
  RESTRICTED_MODE,
  SELECTED_SERVICE,
} from 'src/app/services/store/store.selectors';
import { Observable, Subscription } from 'rxjs';
import { SQLQuery } from 'src/app/models/measure.model';
import {
  KpiVisualization,
  Visualization,
  VisualizationData,
} from 'src/app/models/visualization.model';
import {
  distinctUntilChanged,
  distinctUntilKeyChanged,
  filter,
  map,
  shareReplay,
  startWith,
  withLatestFrom,
} from 'rxjs/operators';
import { refreshVisualization } from 'src/app/services/store/store.actions';
import { MathExpression } from 'mathjs';
import { HttpErrorResponse } from '@angular/common/http';
import { ErrorDialogComponent } from '../error-dialog/error-dialog.component';

@Component({
  selector: 'app-kpi-visualization',
  templateUrl: './kpi-visualization.component.html',
  styleUrls: ['./kpi-visualization.component.scss'],
})
export class KpiVisualizationComponent implements OnInit, OnDestroy {
  @Input() data$: Observable<VisualizationData | VisualizationData[]>;
  @Input() visualization$: Observable<Visualization>;
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
  error$: Observable<{ error: any }>;
  constructor(
    private dialog: MatDialog,
    private ngrxStore: Store,
    private cdref: ChangeDetectorRef,
  ) {}

  ngOnDestroy(): void {
    this.subscriptions$.forEach((subscription) =>
      subscription.unsubscribe(),
    );
  }

  ngOnInit(): void {
    this.fetchDate$ = this.data$.pipe(
      filter((data) => !!data),
      map((data) => data as VisualizationData[]),
      map((data) =>
        data.map((entry) =>
          entry ? new Date(entry.fetchDate) : undefined,
        ),
      ), // map each entry onto its fetch date
      map((dates) =>
        dates.reduce((max, curr) =>
          curr?.getTime() > max?.getTime() ? curr : max,
        ),
      ), // take the latest fetch date
      map((timestamp) => timestamp?.toISOString()), // convert to iso string
    );

    // true if any query is still loading
    this.dataIsLoading$ = this.data$.pipe(
      map(
        (data: VisualizationData[]) =>
          data === undefined ||
          data.some((v) => v === null) ||
          data.some((v) => v?.loading),
      ),
      distinctUntilChanged(),
    );

    // if any vdata has an erorr then error observable will contain the first error which occurred
    this.error$ = this.data$.pipe(
      map(
        (data) =>
          (data as VisualizationData[]).find(
            (vdata) => !!vdata?.error,
          )?.error,
      ),
    );

    this.expression$ = this.visualization$.pipe(
      map((viz) => (viz as KpiVisualization).expression),
      shareReplay(1),
    );

    this.scope$ = this.data$.pipe(
      filter((data) => allDataLoaded(data as VisualizationData[])),
      map((data) => data as VisualizationData[]),
      map((data) => data.map((vdata) => vdata?.data)), // map each vdata onto the actual data
      filter((data) => data.some((d) => !!d)), // filter out empty data
      map((data) =>
        data.map((d) => {
          return d[2][0];
        }),
      ), // map each data onto the actual data
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
}

function allDataLoaded(data: VisualizationData[]): boolean {
  if (!data) return false;

  return (
    !data.some((vdata) => vdata === null) &&
    !data.some((v) => v?.data === null) &&
    !data.some((vdata) => vdata?.error) &&
    !data.some((vdata) => vdata?.loading)
  );
}
