import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {ServiceInformation} from '../store.service';
import {MeasureMap} from '../../success-model/measure-catalog';
import {SuccessFactor} from '../../success-model/success-factor';
import {MatDialog} from '@angular/material';
import {PickMeasureDialogComponent} from './pick-measure-dialog/pick-measure-dialog.component';
import {Measure} from '../../success-model/measure';
import {ConfirmationDialogComponent} from '../confirmation-dialog/confirmation-dialog.component';
import {TranslateService} from '@ngx-translate/core';

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
      data: {measures: Object.values(this.measures), service: this.service},
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.factor.measures.push((result as Measure).name);
      }
      this.factorChange.emit(this.factor);
    });
  }

  private removeMeasure(measureIndex: number) {
    delete this.factor.measures[measureIndex];
    this.factorChange.emit(this.factor);
  }
}
