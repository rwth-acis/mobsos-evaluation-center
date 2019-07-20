import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {ServiceInformation} from '../store.service';
import {MeasureMap} from '../../success-model/measure-catalog';
import {SuccessFactor} from '../../success-model/success-factor';
import {MatDialog} from '@angular/material';
import {PickMeasureDialogComponent} from './pick-measure-dialog/pick-measure-dialog.component';
import {Measure} from '../../success-model/measure';
import {ConfirmationDialogComponent} from '../confirmation-dialog/confirmation-dialog.component';
import {TranslateService} from '@ngx-translate/core';
import {EditFactorDialogComponent} from '../success-dimension/edit-factor-dialog/edit-factor-dialog.component';

@Component({
  selector: 'app-success-factor',
  templateUrl: './success-factor.component.html',
  styleUrls: ['./success-factor.component.scss']
})
export class SuccessFactorComponent implements OnInit {
  @Input() factor: SuccessFactor;
  @Input() service: ServiceInformation;
  @Input() measures: MeasureMap;
  @Input() editMode = false;

  @Output() factorChange = new EventEmitter<SuccessFactor>();
  @Output() measureChange = new EventEmitter<MeasureMap>();

  constructor(private translate: TranslateService, private dialog: MatDialog) {
  }

  ngOnInit() {
  }

  async openRemoveMeasureDialog(measureIndex: number) {
    const message = await this.translate.get('success-factor.remove-measure-prompt').toPromise();
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      minWidth: 300,
      data: message,
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.removeMeasure(measureIndex);
      }
    });
  }

  openPickMeasureDialog() {
    const dialogRef = this.dialog.open(PickMeasureDialogComponent, {
      minWidth: 300,
      width: '80%',
      data: {measures: Object.values(this.measures), service: this.service},
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.factor.measures.push((result as Measure).name);
      }
      this.factorChange.emit(this.factor);
    });
    dialogRef.componentInstance.measuresChanged.subscribe((measures) => {
      for (const measure of measures) {
        this.measures[measure.name] = measure;
      }
      this.measureChange.emit(this.measures);
    });
  }

  onEditClicked() {
    const dialogRef = this.dialog.open(EditFactorDialogComponent, {
      width: '250px',
      data: {factor: this.factor}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.factor = result;
        this.factorChange.emit(this.factor);
      }
    });
  }

  private removeMeasure(measureIndex: number) {
    this.factor.measures.splice(measureIndex, 1);
    this.factorChange.emit(this.factor);
  }
}
