import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ServiceInformation } from '../store.service';
import { MeasureMap } from '../../success-model/measure-catalog';
import { SuccessFactor } from '../../success-model/success-factor';
import { MatDialog } from '@angular/material/dialog';
import { PickMeasureDialogComponent } from './pick-measure-dialog/pick-measure-dialog.component';
import { Measure } from '../../success-model/measure';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import { TranslateService } from '@ngx-translate/core';
import { EditFactorDialogComponent } from '../success-dimension/edit-factor-dialog/edit-factor-dialog.component';
import { Store } from '@ngrx/store';
import { EDIT_MODE } from '../services/store.selectors';
import { editFactorInDimension } from '../services/store.actions';

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
  editMode$ = this.ngrxStore.select(EDIT_MODE);

  @Output() sendFactorToDimension = new EventEmitter<SuccessFactor>();
  @Output() sendMeasuresToDimension = new EventEmitter<MeasureMap>();

  constructor(
    private translate: TranslateService,
    private dialog: MatDialog,
    private ngrxStore: Store
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
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.factor.measures.push((result as Measure).name);
      }
      this.ngrxStore.dispatch(
        editFactorInDimension({
          factor: this.factor,
          oldFactorName: this.factor.name,
          dimensionName: this.dimensionName,
        })
      );
      this.sendFactorToDimension.emit(this.factor);
    });
    dialogRef.componentInstance.measuresChanged.subscribe((measures) => {
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
    });
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
          })
        );
        this.factor = result;
      }
    });
  }

  private removeMeasure(measureIndex: number) {
    this.factor.measures.splice(measureIndex, 1);
    this.sendFactorToDimension.emit(this.factor);
  }
}
