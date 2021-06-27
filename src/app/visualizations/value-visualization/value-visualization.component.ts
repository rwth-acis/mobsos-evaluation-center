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
import { Observable } from 'rxjs';
import { VData } from 'src/app/models/visualization.model';
import {
  distinctUntilKeyChanged,
  filter,
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
  implements VisualizationComponent, OnInit, OnChanges, OnDestroy
{
  value: string = null;
  @Input() measureName: string;

  service: ServiceInformation;
  service$: Observable<ServiceInformation> = this.ngrxStore
    .select(SELECTED_SERVICE)
    .pipe(
      filter((service) => !!service),
      distinctUntilKeyChanged('name'),
    );
  value$: Observable<VData>;
  measure$: Observable<Measure>;

  constructor(dialog: MatDialog, protected ngrxStore: Store) {
    super(ngrxStore, dialog);
  }

  ngOnInit() {
    this.visualizationInitialized = false;
    this.measure$ = this.ngrxStore.select(MEASURE, this.measureName);

    this.measure$
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
        this.value$ = this.ngrxStore.select(
          VISUALIZATION_DATA_FOR_QUERY,
          query,
        );
        this.value$
          .pipe(
            tap((data) => (this.error = data?.error)),
            filter((data) => !!data && !data.error),
          )
          .subscribe((v) => {
            this.value =
              v?.data?.slice(-1)[0]?.length === 0
                ? 0
                : v.data.slice(-1)[0][0];
            this.visualizationInitialized = true;
          });
      });
  }
}
