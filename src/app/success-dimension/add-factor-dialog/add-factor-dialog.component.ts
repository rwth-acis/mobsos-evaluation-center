import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';

export interface DialogData {
  factorName: string;
}


@Component({
  selector: 'app-add-factor-dialog',
  templateUrl: './add-factor-dialog.component.html',
  styleUrls: ['./add-factor-dialog.component.scss']
})
export class AddFactorDialogComponent implements OnInit {
  factorName = '';

  constructor(public dialogRef: MatDialogRef<AddFactorDialogComponent>) { }

  ngOnInit() {
  }

  onCancelClick(): void {
    this.dialogRef.close();
  }

}
