import { Component, Input, OnInit } from '@angular/core';

import { EditFactorDialogComponent } from './edit-factor-dialog/edit-factor-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { Store } from '@ngrx/store';

import { ConfirmationDialogComponent } from 'src/app/shared/confirmation-dialog/confirmation-dialog.component';
import { MeasureMap } from 'src/app/models/measure.catalog';
import { ServiceInformation } from 'src/app/models/service.model';
import { USER_HAS_EDIT_RIGHTS } from 'src/app/services/store.selectors';
import { SuccessFactor } from 'src/app/models/success.model';
import {
  addFactorToDimension,
  removeFactor,
} from 'src/app/services/store.actions';

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

  private _factors: SuccessFactor[];

  constructor(
    private dialog: MatDialog,
    private translate: TranslateService,
    private ngrxStore: Store,
  ) {}

  get factors(): SuccessFactor[] {
    return this._factors;
  }

  @Input() set factors(factors: SuccessFactor[]) {
    this._factors = [...factors];
  }

  ngOnInit() {}

  async openAddFactorDialog(): Promise<void> {
    const dialogRef = this.dialog.open(EditFactorDialogComponent, {
      // width: '250px',
      data: { factor: new SuccessFactor('', []) },
    });

    const result = await dialogRef.afterClosed().toPromise();
    if (result) {
      this._factors.push(result);
      this.ngrxStore.dispatch(
        addFactorToDimension({
          factor: result,
          dimensionName: this.name,
        }),
      );
    }
  }

  openRemoveFactorDialog(factorIndex: number) {
    const message = this.translate.instant(
      'success-dimension.remove-factor-prompt',
    ) as string;
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      minWidth: 300,
      data: message,
    });
    const result = dialogRef.afterClosed();
    if (result) {
      this.removeFactor(factorIndex);
    }
  }

  private removeFactor(factorIndex: number) {
    this.ngrxStore.dispatch(
      removeFactor({ name: this._factors[factorIndex].name }),
    );
  }
}
