import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-unavailable-services-dialog',
  templateUrl: './unavailable-services-dialog.component.html',
  styleUrls: ['./unavailable-services-dialog.component.scss'],
})
export class UnavailableServicesDialogComponent implements OnInit {
  dataSource: { name: string; reason: string }[];
  displayedColumns: string[];
  columns: string[];
  network = environment.las2peerWebConnectorUrl;
  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: { services: { name: string; reason: string }[] },
  ) {}

  ngOnInit(): void {
    if (!(this.data?.services?.length > 0)) {
      return;
    }
    this.columns = Object.keys(this.data.services[0]);
    this.displayedColumns = Object.keys(this.data.services[0]).map(
      (key) => key.charAt(0).toUpperCase() + key.slice(1),
    );
    this.dataSource = this.data.services;
  }
}
