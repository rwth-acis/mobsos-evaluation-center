import { Component, Input } from '@angular/core';

import { EditFactorDialogComponent } from './edit-factor-dialog/edit-factor-dialog.component';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { TranslateService } from '@ngx-translate/core';
import { Store } from '@ngrx/store';

import { ConfirmationDialogComponent } from 'src/app/shared/dialogs/confirmation-dialog/confirmation-dialog.component';

import { USER_HAS_EDIT_RIGHTS } from 'src/app/services/store/store.selectors';
import { SuccessFactor } from 'src/app/models/success.model';
import {
  addFactorToDimension,
  removeFactor,
} from 'src/app/services/store/store.actions';

@Component({
  selector: 'app-success-dimension',
  templateUrl: './success-dimension.component.html',
  styleUrls: ['./success-dimension.component.scss'],
})
export class SuccessDimensionComponent {
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

  async openAddFactorDialog(): Promise<void> {
    const dialogRef = this.dialog.open(EditFactorDialogComponent, {
      // width: '250px',
      data: { factor: new SuccessFactor('', []) },
    });

    const result = await dialogRef.afterClosed().toPromise();
    if (result) {
      this.ngrxStore.dispatch(
        addFactorToDimension({
          factor: result,
          dimensionName: this.name,
        }),
      );
    }
  }

  async openRemoveFactorDialog(factorIndex: number): Promise<void> {
    const message = this.translate.instant(
      'success-dimension.remove-factor-prompt',
    ) as string;
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      minWidth: 300,
      data: message,
    });
    const result = await dialogRef.afterClosed().toPromise();
    if (result) {
      this.ngrxStore.dispatch(
        removeFactor({ name: this._factors[factorIndex].name }),
      );
    }
  }
}
