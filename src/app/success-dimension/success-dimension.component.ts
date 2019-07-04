import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {SuccessFactor} from '../../success-model/success-factor';
import {MeasureMap} from '../../success-model/measure-catalog';
import {ServiceInformation} from '../store.service';
import {EditFactorDialogComponent} from './edit-factor-dialog/edit-factor-dialog.component';
import {MatDialog} from '@angular/material';
import {ConfirmationDialogComponent} from '../confirmation-dialog/confirmation-dialog.component';
import {TranslateService} from '@ngx-translate/core';

@Component({
  selector: 'app-success-dimension',
  templateUrl: './success-dimension.component.html',
  styleUrls: ['./success-dimension.component.scss']
})
export class SuccessDimensionComponent implements OnInit {
  @Input() measures: MeasureMap;
  @Input() service: ServiceInformation;
  @Input() name: string;
  @Input() description: string;
  @Input() icon: string;
  @Input() editMode = false;

  @Output() factorsChange = new EventEmitter<SuccessFactor[]>();

  constructor(private dialog: MatDialog, private translate: TranslateService) {
  }

  private _factors: SuccessFactor[];

  get factors() {
    return this._factors;
  }

  @Input() set factors(factors: SuccessFactor[]) {
    this._factors = factors;
  }

  ngOnInit() {

  }

  openAddFactorDialog() {
    const dialogRef = this.dialog.open(EditFactorDialogComponent, {
      width: '250px',
      data: {factor: new SuccessFactor('', [])}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this._factors.push(result);
        this.factorsChange.emit(this._factors);
      }
    });
  }

  async openRemoveFactorDialog(factorIndex: number) {
    const message = await this.translate.get('success-dimension.remove-factor-prompt').toPromise();
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      minWidth: 300,
      data: message,
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.removeFactor(factorIndex);
      }
    });
  }

  private removeFactor(factorIndex: number) {
    delete this._factors[factorIndex];
    this.factorsChange.emit(this._factors);
  }
}
