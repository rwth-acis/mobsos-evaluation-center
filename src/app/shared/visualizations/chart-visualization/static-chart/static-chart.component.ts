import { Component, Inject } from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { ChartData } from 'src/app/models/chart.model';

@Component({
  selector: 'app-static-chart',
  templateUrl: './static-chart.component.html',
  styleUrls: ['./static-chart.component.scss'],
})
export class StaticChartComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public chartData: ChartData,
    private dialogRef: MatDialogRef<StaticChartComponent>,
  ) {}
}
