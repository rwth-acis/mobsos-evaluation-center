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
  distinctUntilKeyChanged,
  filter,
  map,
  tap,
  withLatestFrom,
} from 'rxjs/operators';
import { ServiceInformation } from 'src/app/models/service.model';
import { Measure } from 'src/app/models/measure.model';
import { HttpErrorResponse } from '@angular/common/http';

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
  error$: Observable<HttpErrorResponse>;
  value$: Observable<string>;
  service$: Observable<ServiceInformation> = this.ngrxStore
    .select(SELECTED_SERVICE)
    .pipe(
      filter((service) => !!service),
      distinctUntilKeyChanged('name'),
    );

  subscriptions$: Subscription[] = [];

  service: ServiceInformation;

  constructor(dialog: MatDialog, protected ngrxStore: Store) {
    super(ngrxStore, dialog);
  }

  ngOnDestroy() {
    this.subscriptions$.forEach((sub) => sub.unsubscribe());
  }

  ngOnInit() {
    this.measure$ = this.ngrxStore.select(MEASURE, this.measureName);

    const sub = this.measure$
      .pipe(withLatestFrom(this.service$))
      .subscribe(([measure, service]) => {
        this.measure = measure;
        this.service = service;
        let query = this.measure?.queries[0].sql;

        const queryParams = this.getParamsForQuery(query);
        query = this.applyVariableReplacements(query, this.service);
        query =
          BaseVisualizationComponent.applyCompatibilityFixForVisualizationService(
            query,
          );
        super.fetchVisualizationData(query, queryParams);
        this.data$ = this.ngrxStore.select(
          VISUALIZATION_DATA_FOR_QUERY,
          query,
        );
        this.error$ = this.data$.pipe(map((data) => data?.error));
        this.value$ = this.data$.pipe(
          map((visualizationData) => visualizationData.data),
          filter((data) => !!data),
          map((data) =>
            data.slice(-1)[0].length === 0 ? 0 : data.slice(-1)[0][0],
          ),
        );
        // this.data$.pipe(filter((data) => !!data)).subscribe((v) => {
        //   this.value =
        //     v?.data?.slice(-1)[0]?.length === 0
        //       ? 0
        //       : v.data.slice(-1)[0][0];
        //   this.visualizationInitialized = true;
        // });
      });

    this.subscriptions$.push(sub);
  }
}
