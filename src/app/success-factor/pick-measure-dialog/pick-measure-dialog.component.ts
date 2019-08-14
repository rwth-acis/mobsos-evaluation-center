import {Component, EventEmitter, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from '@angular/material';
import {Measure} from '../../../success-model/measure';
import {ServiceInformation} from '../../store.service';
import {EditMeasureDialogComponent} from '../edit-measure-dialog/edit-measure-dialog.component';
import {Query} from '../../../success-model/query';
import {ValueVisualization} from '../../../success-model/visualization';

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

  measuresChanged = new EventEmitter<Measure[]>();

  constructor(private dialogRef: MatDialogRef<PickMeasureDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: DialogData, private dialog: MatDialog) {
  }

  ngOnInit() {
  }

  onMeasureClicked(measure: Measure) {
    this.dialogRef.close(measure);
  }

  openNewMeasureDialog() {
    const dialogRef = this.dialog.open(EditMeasureDialogComponent, {
      minWidth: 300,
      width: '80%',
      data: {
        measure: new Measure('', [new Query('', '')], new ValueVisualization(''), []),
        service: this.data.service, create: true
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.data.measures.unshift(result);
        this.measuresChanged.emit(this.data.measures);
      }
    });
  }

  deleteMeasure(measureIndex: number) {
    this.data.measures.splice(measureIndex, 1);
    this.measuresChanged.emit(this.data.measures);
  }
}
