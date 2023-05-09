import { Component, Inject, OnInit } from '@angular/core';
import {
  MatLegacyDialogRef as MatDialogRef,
  MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA,
} from '@angular/material/legacy-dialog';
import { ChartData } from 'src/app/models/chart.model';

@Component({
  selector: 'app-static-chart',
  templateUrl: './static-chart.component.html',
  styleUrls: ['./static-chart.component.scss'],
})
export class StaticChartComponent implements OnInit {
  constructor(
    @Inject(MAT_DIALOG_DATA) public chartData: ChartData,
    private dialogRef: MatDialogRef<StaticChartComponent>,
  ) {}

  ngOnInit(): void {
    this.chartData.options = {
      ...this.chartData.options,
      chartArea: {
        right: '20%',
        top: '5%',
        width: '60%',
        height: '90%',
      },
    };
  }
}
