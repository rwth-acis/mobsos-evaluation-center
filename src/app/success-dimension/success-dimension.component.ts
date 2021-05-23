import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { SuccessFactor } from '../../success-model/success-factor';
import { MeasureMap } from '../../success-model/measure-catalog';
import { ServiceInformation } from '../store.service';
import { EditFactorDialogComponent } from './edit-factor-dialog/edit-factor-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import { TranslateService } from '@ngx-translate/core';
import { Store } from '@ngrx/store';
import { EDIT_MODE } from '../services/store.selectors';
import { addFactorToDimension } from '../services/store.actions';

@Component({
  selector: 'app-success-dimension',
  templateUrl: './success-dimension.component.html',
  styleUrls: ['./success-dimension.component.scss'],
})
export class SuccessDimensionComponent implements OnInit {
  @Input() measures: MeasureMap;
  @Input() service: ServiceInformation;
  @Input() name: string;
  @Input() description: string;
  @Input() icon: string;
  editMode$ = this.ngrxStore.select(EDIT_MODE);

  @Output() sendFactorsToSuccessModel = new EventEmitter<{
    factors: SuccessFactor[];
    dimensionName: string;
  }>();
  @Output() sendMeasuresToSuccessModel = new EventEmitter<MeasureMap>();

  constructor(
    private dialog: MatDialog,
    private translate: TranslateService,
    private ngrxStore: Store
  ) {}

  private _factors: SuccessFactor[];

  get factors() {
    return this._factors;
  }

  @Input() set factors(factors: SuccessFactor[]) {
    this._factors = [...factors];
  }

  ngOnInit() {}

  openAddFactorDialog() {
    const dialogRef = this.dialog.open(EditFactorDialogComponent, {
      // width: '250px',
      data: { factor: new SuccessFactor('', []) },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this._factors.push(result);
        this.ngrxStore.dispatch(
          addFactorToDimension({ factor: result, dimensionName: this.name })
        );
        // this.sendFactorsToSuccessModel.emit({
        //   factors: this._factors,
        //   dimensionName: this.name,
        // });
      }
    });
  }

  _onMeasuresChange(event) {
    this.sendMeasuresToSuccessModel.emit(event);
  }

  _onFactorsChange(event) {
    // console.log(event);
    this.sendFactorsToSuccessModel.emit(event);
  }

  async openRemoveFactorDialog(factorIndex: number) {
    const message = await this.translate
      .get('success-dimension.remove-factor-prompt')
      .toPromise();
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      minWidth: 300,
      data: message,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.removeFactor(factorIndex);
      }
    });
  }

  private removeFactor(factorIndex: number) {
    this._factors.splice(factorIndex, 1);
    this.sendFactorsToSuccessModel.emit({
      factors: this._factors,
      dimensionName: this.name,
    });
  }
}
