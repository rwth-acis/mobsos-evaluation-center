import { Component, Input, OnInit } from '@angular/core';
import { BaseVisualizationComponent } from '../visualization.component';
import { MatDialog } from '@angular/material/dialog';

import { Store } from '@ngrx/store';
import {
  MEASURE,
  VISUALIZATION_DATA_FOR_QUERY,
} from 'src/app/services/store.selectors';
import { Observable } from 'rxjs';
import { Measure } from 'src/app/models/measure.model';
import {
  KpiVisualization,
  VData,
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

@Component({
  selector: 'app-kpi-visualization',
  templateUrl: './kpi-visualization.component.html',
  styleUrls: ['./kpi-visualization.component.scss'],
})
export class KpiVisualizationComponent
  extends BaseVisualizationComponent
  implements OnInit
{
  abstractTerm = [];
  term = [];

  constructor(dialog: MatDialog, protected ngrxStore: Store) {
    super(ngrxStore, dialog);
  }

  @Input() measureName: string;
  measure$: Observable<Measure>;
  queries$: Observable<string[]>;
  dataArray$: Observable<VData[]>;
  kpi$: Observable<{ abstractTerm: string[]; term: string[] }>;

  async ngOnInit() {
    // selects the measure from the measure catalog
    this.measure$ = this.ngrxStore
      .select(MEASURE, this.measureName)
      .pipe(
        filter((measure) => !!measure),
        distinctUntilKeyChanged('queries'),
      );

    // gets the query strings from the measure and applies variable replacements
    this.queries$ = this.measure$.pipe(
      withLatestFrom(this.service$),
      map(([measure, service]) =>
        // apply replacement for each query
        measure.queries.map((query) => {
          let q = query.sql;
          q = this.applyVariableReplacements(q, service);
          q =
            BaseVisualizationComponent.applyCompatibilityFixForVisualizationService(
              q,
            );
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
            (query: string): Observable<VData> =>
              this.ngrxStore.select(
                VISUALIZATION_DATA_FOR_QUERY,
                query,
              ),
          ),
        ),
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
          query = this.applyVariableReplacements(query, service);
          query =
            BaseVisualizationComponent.applyCompatibilityFixForVisualizationService(
              query,
            );
          super.fetchVisualizationData(query, queryParams);
        });
      });
    this.subscriptions$.push(sub);
  }
}
