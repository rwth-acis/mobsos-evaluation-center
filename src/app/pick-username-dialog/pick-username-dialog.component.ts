import { Component, Inject, OnInit } from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';

@Component({
  selector: 'app-pick-username-dialog',
  templateUrl: './pick-username-dialog.component.html',
  styleUrls: ['./pick-username-dialog.component.scss'],
})
export class PickUsernameDialogComponent implements OnInit {
  constructor(
    public dialogRef: MatDialogRef<PickUsernameDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { name: string },
  ) {}

  ngOnInit(): void {}
}
