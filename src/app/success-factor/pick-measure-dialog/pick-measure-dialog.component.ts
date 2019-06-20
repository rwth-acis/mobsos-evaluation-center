import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';
import {Measure} from '../../../success-model/measure';
import {ServiceInformation} from '../../store.service';

export interface DialogData {
  measures: Measure[];
  service: ServiceInformation;
}

@Component({
  selector: 'app-pick-measure-dialog',
  templateUrl: './pick-measure-dialog.component.html',
  styleUrls: ['./pick-measure-dialog.component.scss']
})
export class PickMeasureDialogComponent implements OnInit {

  constructor(private dialogRef: MatDialogRef<PickMeasureDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: DialogData) {
  }

  ngOnInit() {
  }

  onMeasureClicked(measure: Measure) {
    this.dialogRef.close(measure);
  }
}
