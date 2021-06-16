import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';

import { EditFactorDialogComponent } from './edit-factor-dialog/edit-factor-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import { TranslateService } from '@ngx-translate/core';
import { Store } from '@ngrx/store';
import {
  EDIT_MODE,
  ROLE_IN_CURRENT_WORKSPACE,
  USER_HAS_EDIT_RIGHTS,
} from '../services/store.selectors';
import {
  addFactorToDimension,
  removeFactor,
} from '../services/store.actions';
import { ServiceInformation } from '../models/service.model';
import { combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { SuccessFactor } from '../models/success.model';
import { MeasureMap } from '../models/measure.catalog';

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

  canEdit$ = this.ngrxStore.select(USER_HAS_EDIT_RIGHTS);

  @Output() sendFactorsToSuccessModel = new EventEmitter<{
    factors: SuccessFactor[];
    dimensionName: string;
  }>();
  @Output() sendMeasuresToSuccessModel =
    new EventEmitter<MeasureMap>();

  constructor(
    private dialog: MatDialog,
    private translate: TranslateService,
    private ngrxStore: Store,
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
          addFactorToDimension({
            factor: result,
            dimensionName: this.name,
          }),
        );
      }
    });
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
    this.ngrxStore.dispatch(
      removeFactor({ name: this._factors[factorIndex].name }),
    );
  }
}
