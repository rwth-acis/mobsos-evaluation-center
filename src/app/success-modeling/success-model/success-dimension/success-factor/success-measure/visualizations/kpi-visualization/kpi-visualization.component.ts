import { Component, Input, OnInit } from '@angular/core';
import {
  applyCompatibilityFixForVisualizationService,
  VisualizationComponent,
} from '../visualization.component';
import { MatDialog } from '@angular/material/dialog';

import { Store } from '@ngrx/store';
import {
  MEASURE,
  RESTRICTED_MODE,
  VISUALIZATION_DATA_FOR_QUERY,
} from 'src/app/services/store.selectors';
import { Observable, Subscription } from 'rxjs';
import { Measure } from 'src/app/models/measure.model';
import {
  KpiVisualization,
  VisualizationData,
} from 'src/app/models/visualization.model';
import {
  distinctUntilChanged,
  distinctUntilKeyChanged,
  filter,
  first,
  map,
  mergeMap,
  withLatestFrom,
} from 'rxjs/operators';
import { forkJoin } from 'rxjs';
import { refreshVisualization } from 'src/app/services/store.actions';

@Component({
  selector: 'app-kpi-visualization',
  templateUrl: './kpi-visualization.component.html',
  styleUrls: ['./kpi-visualization.component.scss'],
})
export class KpiVisualizationComponent
  extends VisualizationComponent
  implements OnInit
{
  @Input() measure$: Observable<Measure>;

  queries$: Observable<string[]>;
  dataArray$: Observable<VisualizationData[]>;
  dataIsLoading$: Observable<boolean>;
  kpi$: Observable<{ abstractTerm: string[]; term: string[] }>;
  restricted$ = this.ngrxStore.select(RESTRICTED_MODE);
  fetchDate$: Observable<string>; // latest fetch date as iso string
  private subscriptions$: Subscription[] = [];

  constructor(dialog: MatDialog, protected ngrxStore: Store) {
    super(ngrxStore, dialog);
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

    // selects the query data for each query from the store
    this.dataArray$ = this.queries$.pipe(
      filter((qs) => !!qs),
      mergeMap((queries) =>
        forkJoin(
          queries.map(
            (queryString: string): Observable<VisualizationData> =>
              this.ngrxStore.select(
                VISUALIZATION_DATA_FOR_QUERY({ queryString }),
              ),
          ),
        ),
      ),
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
      map(
        (data: VisualizationData[]) =>
          data === undefined || data.some((v) => v.loading),
      ),
    );

    // if any vdata has an erorr then error observable will contain the first error which occurred
    this.error$ = this.dataArray$.pipe(
      map((data) => data.find((vdata) => !!vdata.error)?.error),
    );

    let sub = this.error$.subscribe((err) => {
      this.error = err;
    });
    this.subscriptions$.push(sub);

    this.kpi$ = this.dataArray$.pipe(
      filter((data) => !data.find((vdata) => vdata.error)), // only proceed if no error occurred
      map((data) => data.map((vdata) => vdata.data)), // map each vdata onto the actual data
      withLatestFrom(this.measure$),
      map(([data, measure]) => {
        const abstractTerm = [];
        const term = [];
        let visualization: KpiVisualization =
          measure?.visualization as KpiVisualization;
        if (!(visualization instanceof KpiVisualization)) {
          visualization = new KpiVisualization(
            (visualization as KpiVisualization).operationsElements,
          );
        }

        for (const operationElement of visualization.operationsElements) {
          abstractTerm.push(operationElement.name);
          // even index means, that this must be an operand since we only support binary operators
          if (operationElement.index % 2 === 0) {
            const value =
              data.slice(-1)[0].length === 0
                ? 0
                : data.slice(-1)[0][0];
            term.push(value);
          } else {
            term.push(operationElement.name);
          }
        }
        if (term.length > 1) {
          abstractTerm.push('=');
          abstractTerm.push(this.measure.name);
          let termResult = visualization.evaluateTerm(term);
          if (typeof termResult === 'number') {
            termResult = termResult.toFixed(2);
          }
          term.push('=');
          term.push(termResult);
        }
        return { abstractTerm, term };
      }),
    );

    sub = this.measure$
      .pipe(withLatestFrom(this.service$), first())
      .subscribe(([measure, service]) => {
        const queryStrings = measure.queries.map(
          (query) => query.sql,
        );
        queryStrings.forEach((query) => {
          const queryParams = this.getParamsForQuery(query);
          query = super.applyVariableReplacements(query, service);
          query = applyCompatibilityFixForVisualizationService(query);
          super.fetchVisualizationData(query, queryParams);
        });
      });
    this.subscriptions$.push(sub);
  }

  onRefreshClicked(query: string): void {
    this.ngrxStore.dispatch(
      refreshVisualization({
        query,
        queryParams: super.getParamsForQuery(query),
      }),
    );
  }
}
