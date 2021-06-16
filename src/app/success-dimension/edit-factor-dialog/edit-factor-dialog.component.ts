import { Component, Inject, OnInit } from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { SuccessFactor } from 'src/app/models/success.model';

export interface DialogData {
  factor: SuccessFactor;
}

@Component({
  selector: 'app-edit-factor-dialog',
  templateUrl: './edit-factor-dialog.component.html',
  styleUrls: ['./edit-factor-dialog.component.scss'],
})
export class EditFactorDialogComponent implements OnInit {
  constructor(
    public dialogRef: MatDialogRef<EditFactorDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
  ) {}

  ngOnInit() {}

  onCancelClick(): void {
    this.dialogRef.close();
  }

  onOkClick() {
    if (!!this.data.factor.name) {
      this.dialogRef.close(this.data.factor);
    }
  }
}
