import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-unavailable-services-dialog',
  templateUrl: './unavailable-services-dialog.component.html',
  styleUrls: ['./unavailable-services-dialog.component.scss'],
})
export class UnavailableServicesDialogComponent implements OnInit {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { services: string[] },
  ) {}

  ngOnInit(): void {}
}
