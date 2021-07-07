import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';

import { MatDialog } from '@angular/material/dialog';
import { PickMeasureDialogComponent } from './pick-measure-dialog/pick-measure-dialog.component';

import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import { TranslateService } from '@ngx-translate/core';
import { EditFactorDialogComponent } from '../success-dimension/edit-factor-dialog/edit-factor-dialog.component';
import { Store } from '@ngrx/store';
import {
  _EDIT_MODE,
  MEASURES,
  SELECTED_SERVICE,
  USER_HAS_EDIT_RIGHTS,
} from '../services/store.selectors';
import {
  editFactorInDimension,
  removeFactor,
  removeMeasureFromModel,
} from '../services/store.actions';
import { SuccessFactor } from '../models/success.model';
import { MeasureMap } from '../models/measure.catalog';
import { Measure } from '../models/measure.model';
import { ServiceInformation } from '../models/service.model';
import { Subscription } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-success-factor',
  templateUrl: './success-factor.component.html',
  styleUrls: ['./success-factor.component.scss'],
})
export class SuccessFactorComponent implements OnInit, OnDestroy {
  @Input() factor: SuccessFactor;
  @Input() dimensionName: string;
  service: ServiceInformation;
  measures: MeasureMap;

  canEdit$ = this.ngrxStore.select(USER_HAS_EDIT_RIGHTS);
  service$ = this.ngrxStore.select(SELECTED_SERVICE);
  measures$ = this.ngrxStore
    .select(MEASURES)
    .pipe(distinctUntilChanged());

  @Output() sendFactorToDimension = new EventEmitter<SuccessFactor>();
  @Output() sendMeasuresToDimension = new EventEmitter<MeasureMap>();

  constructor(
    private translate: TranslateService,
    private dialog: MatDialog,
    private ngrxStore: Store,
  ) {}

  subscriptions$: Subscription[] = [];

  ngOnInit() {
    let sub = this.measures$.subscribe(
      (measures) => (this.measures = measures),
    );
    this.subscriptions$.push(sub);
    sub = this.service$.subscribe(
      (service) => (this.service = service),
    );
    this.subscriptions$.push(sub);
  }
  ngOnDestroy() {
    this.subscriptions$.forEach((sub) => sub.unsubscribe());
  }

  async openRemoveMeasureDialog(measureIndex: number) {
    const message = await this.translate
      .get('success-factor.remove-measure-prompt')
      .toPromise();
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      minWidth: 300,
      data: message,
    });
    const result = await dialogRef.afterClosed();
    if (result) {
      this.removeMeasure(measureIndex);
    }
  }

  async openPickMeasureDialog() {
    const dialogRef = this.dialog.open(PickMeasureDialogComponent, {
      minWidth: 300,
      width: '80%',
      data: {
        measures: Object.values(this.measures),
        service: this.service,
        factorName: this.factor.name,
        dimensionName: this.dimensionName,
      },
    });
    const result = await dialogRef.afterClosed().toPromise();
    if (result) {
      this.factor.measures.push((result as Measure).name);
      this.ngrxStore.dispatch(
        editFactorInDimension({
          factor: this.factor,
          oldFactorName: this.factor.name,
          dimensionName: this.dimensionName,
        }),
      );
    }

    const sub = dialogRef.componentInstance.measuresChanged.subscribe(
      (measures) => {
        const existingMeasures = [];
        for (const measure of measures) {
          this.measures[measure.name] = measure;
          existingMeasures.push(measure.name);
        }
        // remove measures that have been deleted
        for (const measureName of Object.keys(this.measures)) {
          if (!existingMeasures.includes(measureName)) {
            delete this.measures[measureName];
          }
        }
        // console.error(this.measures);
        this.sendMeasuresToDimension.emit(this.measures);
      },
    );
    this.subscriptions$.push(sub);
  }

  async onEditClicked() {
    const dialogRef = this.dialog.open(EditFactorDialogComponent, {
      width: '250px',
      data: { factor: { ...this.factor } },
    });

    const result = await dialogRef.afterClosed().toPromise();
    if (result) {
      this.ngrxStore.dispatch(
        editFactorInDimension({
          factor: result,
          oldFactorName: this.factor.name,
          dimensionName: this.dimensionName,
        }),
      );
      this.factor = result;
    }
  }

  private removeMeasure(measureIndex: number) {
    this.ngrxStore.dispatch(
      removeMeasureFromModel({
        name: this.factor.measures[measureIndex],
      }),
    );
    // this.factor.measures.splice(measureIndex, 1);
    // this.sendFactorToDimension.emit(this.factor);
  }
}
