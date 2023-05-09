import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { cloneDeep } from 'lodash-es';

import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';

import { TranslateService } from '@ngx-translate/core';
import { Store } from '@ngrx/store';

import {
  combineLatest,
  firstValueFrom,
  forkJoin,
  Observable,
  of,
  Subscription,
} from 'rxjs';

import {
  distinctUntilChanged,
  distinctUntilKeyChanged,
  filter,
  map,
  shareReplay,
  switchMap,
  take,
} from 'rxjs/operators';
import {
  MEASURE,
  SELECTED_SERVICE,
  USER_HAS_EDIT_RIGHTS,
  VISUALIZATION_DATA_FOR_QUERY,
} from 'src/app/services/store/store.selectors';
import {
  editMeasure,
  fetchVisualizationData,
  removeMeasureFromModel,
} from 'src/app/services/store/store.actions';
import { ServiceInformation } from 'src/app/models/service.model';
import {
  IMeasure,
  Measure,
  SQLQuery,
} from 'src/app/models/measure.model';
import { EditMeasureDialogComponent } from '../edit-measure-dialog/edit-measure-dialog.component';
import { ConfirmationDialogComponent } from 'src/app/shared/dialogs/confirmation-dialog/confirmation-dialog.component';
import {
  ChartVisualization,
  KpiVisualization,
  ValueVisualization,
  Visualization,
  VisualizationData,
} from 'src/app/models/visualization.model';

@Component({
  selector: 'app-success-measure',
  templateUrl: './success-measure.component.html',
  styleUrls: ['./success-measure.component.scss'],
})
export class SuccessMeasureComponent implements OnInit, OnDestroy {
  @Input() measureName: string;
  @Input() dimensionName = '';
  @Input() factorName = '';
  @Input() preview = false;

  data$: Observable<VisualizationData | VisualizationData[]>;
  visualzation$: Observable<Visualization>;
  measure$: Observable<Measure>;
  service$: Observable<ServiceInformation> =
    this.ngrxStore.select(SELECTED_SERVICE);
  subscriptions$: Subscription[] = [];
  canEdit$ = this.ngrxStore.select(USER_HAS_EDIT_RIGHTS);
  queries$: Observable<SQLQuery[]>;
  description$: Observable<string>;

  service: ServiceInformation;
  measure: IMeasure;

  constructor(
    private translate: TranslateService,
    private dialog: MatDialog,
    private ngrxStore: Store,
  ) {}

  /**
   * @todo implement loading functionality and error message display (currently still in visualization component)
   */
  async ngOnInit(): Promise<void> {
    this.measure$ = this.ngrxStore
      .select(MEASURE({ measureName: this.measureName }))
      .pipe(
        filter((measure) => !!measure),
        map((measure) => Measure.fromJSON(measure as Measure)),
      );
    let sub = this.measure$.subscribe((measure) => {
      this.measure = cloneDeep(measure); // needed for when we want to edit the measure
    });
    this.subscriptions$.push(sub);
    sub = this.service$.subscribe(
      (service) => (this.service = service),
    );
    this.subscriptions$.push(sub);

    this.queries$ = this.measure$.pipe(
      map((measure) => measure.queries),
    );
    this.description$ = this.measure$.pipe(
      map((measure) => measure.description),
    );

    this.visualzation$ = this.measure$.pipe(
      map((measure) => {
        switch (measure.visualization.type) {
          case 'Chart':
            return measure.visualization as ChartVisualization;
          case 'KPI':
            return measure.visualization as KpiVisualization;
          case 'Value':
            return measure.visualization as ValueVisualization;

          default:
            console.error(
              'Unknown visualization type: ' +
                measure.visualization.type,
            );
            return null;
        }
      }),
    );

    // retrieve all data for each query from the store
    this.data$ = this.measure$.pipe(
      map((measure) => Measure.fromJSON(measure as Measure).queries), // get all queries
      switchMap((queries) => {
        if (!queries || queries.length === 0) {
          return of(null);
        } else if (queries.length === 1) {
          return this.ngrxStore // case for value and chart
            .select(
              VISUALIZATION_DATA_FOR_QUERY({
                queryString: queries[0].sql,
              }),
            )
            .pipe(
              distinctUntilChanged(
                (prev, curr) => prev?.fetchDate === curr?.fetchDate,
              ),
              shareReplay(1),
            );
        } else {
          // case for kpi
          return combineLatest(
            queries.map((query) =>
              this.ngrxStore
                .select(
                  VISUALIZATION_DATA_FOR_QUERY({
                    queryString: query.sql,
                  }),
                )
                .pipe(
                  distinctUntilChanged(
                    (prev, curr) =>
                      prev?.fetchDate === curr?.fetchDate,
                  ),
                  shareReplay(1),
                ),
            ),
          );
        }
      }),
      shareReplay(1),
    );
    sub = this.measure$
      .pipe(
        map((measure) => ({
          queries: Measure.fromJSON(measure as Measure).queries,
          cache: measure.tags?.includes('generated'),
        })),
      )
      .subscribe(({ queries, cache }) => {
        queries.forEach((query) => {
          this.ngrxStore.dispatch(
            fetchVisualizationData({ query: query.sql, cache }),
          );
        });
      });
    this.subscriptions$.push(sub);
  }

  ngOnDestroy(): void {
    this.subscriptions$.forEach((sub) => sub.unsubscribe());
  }

  async onEditClicked(event: MouseEvent): Promise<void> {
    const oldMeasureName = this.measure.name;
    const dialogRef = this.dialog.open(EditMeasureDialogComponent, {
      width: '80vw',
      height: '80vh',
      data: {
        measure: this.measure,
        service: this.service,
        create: false,
        dimensionName: this.dimensionName,
        factorName: this.factorName,
      },
    });

    const updatedMeasure = await dialogRef.afterClosed().toPromise();

    if (updatedMeasure) {
      this.ngrxStore.dispatch(
        editMeasure({
          measure: updatedMeasure,
          factorName: this.factorName,
          oldMeasureName,
          dimensionName: this.dimensionName,
          catalogOnly: false,
        }),
      );
      this.measure = {
        ...this.measure,
        ...updatedMeasure,
      } as Measure;
    }

    event.stopPropagation();
  }

  async onDeleteClicked($event: MouseEvent): Promise<void> {
    const message = this.translate.instant(
      'success-factor.remove-measure-prompt',
    );
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      minWidth: 300,
      data: message,
    });
    const measure = this.measure;
    const result = await dialogRef.afterClosed().toPromise();
    if (result) {
      this.ngrxStore.dispatch(
        removeMeasureFromModel({ name: measure.name }),
      );
      // this.measureDelete.emit();
    }
    $event.stopPropagation();
  }
}
