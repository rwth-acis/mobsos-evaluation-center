import {
  Component,
  EventEmitter,
  Input,
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
  EDIT_MODE,
  MEASURES,
  USER_HAS_EDIT_RIGHTS,
} from '../services/store.selectors';
import {
  editFactorInDimension,
  removeFactor,
  removeMeasure,
} from '../services/store.actions';
import { SuccessFactor } from '../models/success.model';
import { MeasureMap } from '../models/measure.catalog';
import { Measure } from '../models/measure.model';
import { ServiceInformation } from '../models/service.model';

@Component({
  selector: 'app-success-factor',
  templateUrl: './success-factor.component.html',
  styleUrls: ['./success-factor.component.scss'],
})
export class SuccessFactorComponent implements OnInit {
  @Input() factor: SuccessFactor;
  @Input() dimensionName: string;
  @Input() service: ServiceInformation;
  @Input() measures: MeasureMap;

  canEdit$ = this.ngrxStore.select(USER_HAS_EDIT_RIGHTS);

  @Output() sendFactorToDimension = new EventEmitter<SuccessFactor>();
  @Output() sendMeasuresToDimension = new EventEmitter<MeasureMap>();

  constructor(
    private translate: TranslateService,
    private dialog: MatDialog,
    private ngrxStore: Store,
  ) {}

  ngOnInit() {}

  async openRemoveMeasureDialog(measureIndex: number) {
    const message = await this.translate
      .get('success-factor.remove-measure-prompt')
      .toPromise();
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      minWidth: 300,
      data: message,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.removeMeasure(measureIndex);
      }
    });
  }

  openPickMeasureDialog() {
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
    dialogRef.afterClosed().subscribe((result) => {
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
    });
    dialogRef.componentInstance.measuresChanged.subscribe(
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
  }

  onEditClicked() {
    const dialogRef = this.dialog.open(EditFactorDialogComponent, {
      width: '250px',
      data: { factor: { ...this.factor } },
    });

    dialogRef.afterClosed().subscribe((result: SuccessFactor) => {
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
    });
  }

  private removeMeasure(measureIndex: number) {
    this.ngrxStore.dispatch(
      removeMeasure({ name: this.factor.measures[measureIndex] }),
    );
    // this.factor.measures.splice(measureIndex, 1);
    // this.sendFactorToDimension.emit(this.factor);
  }
}
