import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
} from '@angular/core';
import {
  BaseVisualizationComponent,
  VisualizationComponent,
} from '../visualization.component';
import { MatDialog } from '@angular/material/dialog';

import { Store } from '@ngrx/store';
import {
  MEASURE,
  SELECTED_SERVICE,
  VISUALIZATION_DATA_FOR_QUERY,
} from 'src/app/services/store.selectors';
import { Observable, Subscription } from 'rxjs';
import { VData } from 'src/app/models/visualization.model';
import {
  distinctUntilChanged,
  distinctUntilKeyChanged,
  filter,
  first,
  map,
  mergeMap,
  tap,
  withLatestFrom,
} from 'rxjs/operators';
import { ServiceInformation } from 'src/app/models/service.model';
import { Measure } from 'src/app/models/measure.model';

@Component({
  selector: 'app-value-visualization',
  templateUrl: './value-visualization.component.html',
  styleUrls: ['./value-visualization.component.scss'],
})
export class ValueVisualizationComponent
  extends BaseVisualizationComponent
  implements VisualizationComponent, OnInit, OnDestroy
{
  @Input() measureName: string;

  data$: Observable<VData>;
  measure$: Observable<Measure>;
  query$: Observable<string>;
  value$: Observable<string>;
  service$: Observable<ServiceInformation> = this.ngrxStore
    .select(SELECTED_SERVICE)
    .pipe(
      filter((service) => !!service),
      distinctUntilKeyChanged('name'),
    );

  subscriptions$: Subscription[] = [];

  constructor(dialog: MatDialog, protected ngrxStore: Store) {
    super(ngrxStore, dialog);
  }

  ngOnDestroy(): void {
    this.subscriptions$.forEach((subscription) =>
      subscription.unsubscribe(),
    );
  }

  ngOnInit() {
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
    // selects the query data for the query from the store
    this.data$ = this.query$.pipe(
      filter((query) => !!query),
      mergeMap((query) =>
        this.ngrxStore.select(VISUALIZATION_DATA_FOR_QUERY, query),
      ),
    );

    this.error$ = this.data$.pipe(map((data) => data?.error));

    this.value$ = this.data$.pipe(
      map((visualizationData) => visualizationData?.data),
      filter((data) => !!data),
      map((data) =>
        data.slice(-1)[0].length === 0 ? 0 : data.slice(-1)[0][0],
      ),
    );

    const sub = this.measure$
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
    this.subscriptions$.push(sub);
  }
}
