import { Component, Inject, OnInit } from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';

@Component({
  selector: 'app-add-community-dialog',
  templateUrl: './add-community-dialog.component.html',
  styleUrls: ['./add-community-dialog.component.scss'],
})
export class AddCommunityDialogComponent implements OnInit {
  name: string;
  constructor(
    private dialogRef: MatDialogRef<AddCommunityDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: string,
  ) {}

  ngOnInit(): void {}
}
