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
  VISUALIZATION_DATA_FOR_QUERY,
} from 'src/app/services/store/store.selectors';
import { Observable, Subscription } from 'rxjs';
import {
  VisualizationData,
  ValueVisualization,
} from 'src/app/models/visualization.model';
import {
  distinctUntilChanged,
  distinctUntilKeyChanged,
  filter,
  first,
  map,
  mergeMap,
  startWith,
  tap,
  withLatestFrom,
} from 'rxjs/operators';
import { ServiceInformation } from 'src/app/models/service.model';
import { Measure } from 'src/app/models/measure.model';
import { refreshVisualization } from 'src/app/services/store/store.actions';
import {
  applyCompatibilityFixForVisualizationService,
  VisualizationComponent,
} from '../visualization.component';

@Component({
  selector: 'app-value-visualization',
  templateUrl: './value-visualization.component.html',
  styleUrls: ['./value-visualization.component.scss'],
})
export class ValueVisualizationComponent
  extends VisualizationComponent
  implements OnInit, OnDestroy
{
  @Input() override measure$: Observable<Measure>;

  data$: Observable<VisualizationData>;
  unit$ = this.measure$.pipe(
    map(
      (measure) =>
        (measure.visualization as ValueVisualization)?.unit,
    ),
  );

  query$: Observable<string>;
  value$: Observable<string>;
  restricted$ = this.ngrxStore.select(RESTRICTED_MODE);
  service$: Observable<ServiceInformation> = this.ngrxStore
    .select(SELECTED_SERVICE)
    .pipe(
      filter((service) => !!service),
      distinctUntilKeyChanged('name'),
    );

  dataIsReady$: Observable<boolean>;
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

  ngOnInit(): void {
    // gets the query string from the measure and applies variable replacements
    this.query$ = this.measure$.pipe(
      withLatestFrom(this.service$),
      map(([measure, service]) => {
        let query = measure.queries[0].sql;
        query = super.applyVariableReplacements(query, service);
        query = applyCompatibilityFixForVisualizationService(query);
        return query;
      }),
      distinctUntilChanged(),
    );
    // selects the query data for the query from the store
    this.data$ = this.query$.pipe(
      filter((query) => !!query),
      mergeMap((queryString) =>
        this.ngrxStore
          .select(VISUALIZATION_DATA_FOR_QUERY({ queryString }))
          .pipe(
            filter((data) => !!data),
            distinctUntilKeyChanged('fetchDate'),
          ),
      ),
    );

    this.error$ = this.data$.pipe(map((data) => data?.error));
    this.dataIsReady$ = this.data$.pipe(
      startWith({ loading: false }),
      map((data) => !data?.loading),
      distinctUntilChanged(),
      tap(() => this.cdref.detectChanges()),
    );
    this.value$ = this.data$.pipe(
      map(
        (visualizationData: VisualizationData) =>
          visualizationData?.data,
      ),
      filter((data) => !!data && Array.isArray(data)),
      map((data) =>
        data.slice(-1)[0].length === 0
          ? '0'
          : (data.slice(-1)[0][0] as string),
      ),
      map((value: string | number | boolean) =>
        typeof value === 'string' ? value : value.toString(),
      ),
    );

    const sub = this.measure$
      .pipe(withLatestFrom(this.service$), first())
      .subscribe(([measure, service]) => {
        let query = measure.queries[0].sql;
        const queryParams = super.getParamsForQuery(query);
        query = super.applyVariableReplacements(query, service);
        query = applyCompatibilityFixForVisualizationService(query);
        super.fetchVisualizationData(
          query,
          queryParams,
          this.ngrxStore,
        );
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
