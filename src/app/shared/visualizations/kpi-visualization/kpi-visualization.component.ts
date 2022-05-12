import {
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
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
import { Measure } from 'src/app/models/measure.model';
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
  startWith,
  switchMap,
  tap,
  withLatestFrom,
} from 'rxjs/operators';
import { refreshVisualization } from 'src/app/services/store/store.actions';

@Component({
  selector: 'app-kpi-visualization',
  templateUrl: './kpi-visualization.component.html',
  styleUrls: ['./kpi-visualization.component.scss'],
})
export class KpiVisualizationComponent
  extends VisualizationComponent
  implements OnInit, OnDestroy
{
  @Input() measure$: Observable<Measure>;

  queries$: Observable<string[]>;
  dataArray$: Observable<VisualizationData[]>;
  dataIsLoading$: Observable<boolean>;
  kpi$: Observable<{ abstractTerm: string[]; term: string[] }>;
  restricted$ = this.ngrxStore.select(RESTRICTED_MODE);
  fetchDate$: Observable<string>; // latest fetch date as iso string
  expression$;
  scope$;

  service$ = this.ngrxStore.select(SELECTED_SERVICE).pipe(
    filter((service) => !!service),
    distinctUntilKeyChanged('name'),
    startWith(undefined),
  );
  private subscriptions$: Subscription[] = [];
  constructor(
    protected dialog: MatDialog,
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

  ngOnInit(): void {
    // gets the query strings from the measure and applies variable replacements
    this.queries$ = this.measure$.pipe(
      withLatestFrom(this.service$),
      map(([measure, service]) =>
        // apply replacement for each query
        measure.queries.map((query) => {
          let q = query.sql;
          q = this.applyVariableReplacements(q, service);
          q = applyCompatibilityFixForVisualizationService(q);
          return q;
        }),
      ),
      distinctUntilChanged(),
    );

    this.fetchData(this.queries$);

    // selects the query data for each query from the store
    this.dataArray$ = this.queries$.pipe(
      filter((qs) => !!qs),
      switchMap((queries) =>
        getDataFromStore(queries, this.ngrxStore),
      ),
      catchError((error) => {
        console.error(error);
        return [null, null];
      }),
    );

    this.fetchDate$ = this.dataArray$.pipe(
      map((data) => data.map((entry) => new Date(entry.fetchDate))), // map each entry onto its fetch date
      map((dates) =>
        dates.reduce((max, curr) =>
          curr.getTime() > max.getTime() ? curr : max,
        ),
      ), // take the latest fetch date
      map((timestamp) => timestamp.toISOString()), // convert to iso string
    );

    // true if any query is still loading
    this.dataIsLoading$ = this.dataArray$.pipe(
      startWith(undefined),
      map(
        (data: VisualizationData[]) =>
          data === undefined ||
          data.some((v) => v === null) ||
          data.some((v) => v.loading),
      ),
      distinctUntilChanged(),
      tap(() => this.cdref.detectChanges()),
    );

    // if any vdata has an erorr then error observable will contain the first error which occurred
    this.error$ = this.dataArray$.pipe(
      map((data) => data.find((vdata) => !!vdata.error)?.error),
    );

    // let sub = this.error$.subscribe((err) => {
    //   this.error = err;
    // });
    // this.subscriptions$.push(sub);

    this.expression$ = this.measure$.pipe(
      map(
        (measure) =>
          (measure.visualization as KpiVisualization).expression,
      ),
    );

    this.scope$ = this.dataArray$.pipe(
      filter((data) => allDataLoaded(data)),
      map((data) => data.map((vdata) => vdata.data)), // map each vdata onto the actual data
      map((data) => data.map((d) => d[2][0])), // map each data onto the actual data
      withLatestFrom(this.measure$),
      map(([data, measure]) => {
        const scope = {};
        measure.queries.forEach((query, index) => {
          scope[query.name] = data[index];
        });
        return scope;
      }),
    );

    const sub = this.measure$
      .pipe(withLatestFrom(this.service$), first())
      .subscribe(([measure, service]) => {
        const queryStrings = measure.queries.map(
          (query) => query.sql,
        );
        queryStrings.forEach((query) => {
          const queryParams = this.getParamsForQuery(query);
          query = super.applyVariableReplacements(query, service);
          query = applyCompatibilityFixForVisualizationService(query);
          super.fetchVisualizationData(
            query,
            queryParams,
            this.ngrxStore,
          );
        });
      });
    this.subscriptions$.push(sub);
  }

  onRefreshClicked(queries: string[]): void {
    queries.forEach((query) => {
      this.ngrxStore.dispatch(
        refreshVisualization({
          query,
          queryParams: super.getParamsForQuery(query),
        }),
      );
    });
  }

  fetchData(qs$: Observable<string[]>) {
    const sub = qs$.subscribe((queries) => {
      queries.forEach((query) => {
        const queryParams = super.getParamsForQuery(query);
        super.fetchVisualizationData(
          query,
          queryParams,
          this.ngrxStore,
        );
      });
    });
    this.subscriptions$.push(sub);
  }
}
function getDataFromStore(
  queries: string[],
  store: Store<any>,
): Observable<VisualizationData[]> {
  const data = queries.map(
    (queryString: string): Observable<VisualizationData> =>
      store
        .select(VISUALIZATION_DATA_FOR_QUERY({ queryString }))
        .pipe(
          filter((d) => !!d),
          distinctUntilKeyChanged('fetchDate'),
        ),
  );

  return combineLatest(data);
}
function allDataLoaded(data: VisualizationData[]): boolean {
  if (!data) return false;

  return (
    !data.some((v) => v.data === null) &&
    !data.some((vdata) => vdata.error) &&
    !data.some((vdata) => vdata.loading)
  );
}
/**
 * Function which returns the greatest timestamp when comparing fetchDate
 *
 * @param data
 */
function getLatestFetchDate(data: VisualizationData[]): number {
  if (!data) return null;
  return data.reduce(
    (max, curr) =>
      new Date(curr.fetchDate).getTime() > new Date(max).getTime()
        ? new Date(curr.fetchDate).getTime()
        : max,
    0,
  );
}
const THIRTY_SECONDS = 30000;
const FIVE_MINUTES = THIRTY_SECONDS * 2 * 5;
