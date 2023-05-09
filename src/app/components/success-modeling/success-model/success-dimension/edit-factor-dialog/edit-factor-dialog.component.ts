import { Component, Inject } from '@angular/core';
import {
  MatLegacyDialogRef as MatDialogRef,
  MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA,
} from '@angular/material/legacy-dialog';
import { SuccessFactor } from 'src/app/models/success.model';

export interface DialogData {
  factor: SuccessFactor;
}

@Component({
  selector: 'app-edit-factor-dialog',
  templateUrl: './edit-factor-dialog.component.html',
  styleUrls: ['./edit-factor-dialog.component.scss'],
})
export class EditFactorDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<EditFactorDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
  ) {}

  onCancelClick(): void {
    this.dialogRef.close();
  }

  onOkClick(): void {
    if (!!this.data.factor.name) {
      this.dialogRef.close(this.data.factor);
    }
  }
}
