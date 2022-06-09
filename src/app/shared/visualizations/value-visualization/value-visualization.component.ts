import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
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
  shareReplay,
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
import { HttpErrorResponse } from '@angular/common/http';
import { ErrorDialogComponent } from '../error-dialog/error-dialog.component';

@Component({
  selector: 'app-value-visualization',
  templateUrl: './value-visualization.component.html',
  styleUrls: ['./value-visualization.component.scss'],
})
export class ValueVisualizationComponent
  implements OnInit, OnDestroy
{
  // @Input() override measure$: Observable<Measure>;

  @Input() data$: Observable<VisualizationData>;
  @Input() visualization$: Observable<ValueVisualization>;
  @Input() description$: Observable<string>;

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
  unit$: Observable<string>;
  error$: Observable<HttpErrorResponse>;
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
    this.unit$ = this.visualization$.pipe(map((viz) => viz?.unit));
    this.error$ = this.data$.pipe(map((data) => data?.error));
    this.dataIsReady$ = this.data$.pipe(
      distinctUntilChanged(),
      tap(() => {
        this.cdref.detectChanges();
      }),
      map((data) => !data?.loading),
      shareReplay(1),
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
      distinctUntilChanged(),
      map((value: string | number | boolean) =>
        typeof value === 'string' ? value : value.toString(),
      ),
      shareReplay(1),
    );
  }

  onRefreshClicked(query: string): void {
    this.ngrxStore.dispatch(
      refreshVisualization({
        query,
      }),
    );
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
