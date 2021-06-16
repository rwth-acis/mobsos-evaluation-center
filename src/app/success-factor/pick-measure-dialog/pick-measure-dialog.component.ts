import {
  Component,
  EventEmitter,
  Inject,
  OnInit,
} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';

import { EditMeasureDialogComponent } from '../edit-measure-dialog/edit-measure-dialog.component';
import { Query } from '../../../success-model/query';

import { Store } from '@ngrx/store';
import {
  addMeasureToCatalog,
  addMeasureToFactor,
} from 'src/app/services/store.actions';
import { Measure } from 'src/app/models/measure.model';
import { ValueVisualization } from 'src/app/models/visualization.model';
import { ServiceInformation } from 'src/app/models/service.model';

export interface DialogData {
  measures: Measure[];
  service: ServiceInformation;
  dimensionName: string;
  factorName: string;
}

@Component({
  selector: 'app-pick-measure-dialog',
  templateUrl: './pick-measure-dialog.component.html',
  styleUrls: ['./pick-measure-dialog.component.scss'],
})
export class PickMeasureDialogComponent implements OnInit {
  measuresChanged = new EventEmitter<Measure[]>();

  constructor(
    private dialogRef: MatDialogRef<PickMeasureDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private dialog: MatDialog,
    private ngrxStore: Store,
  ) {}

  ngOnInit() {}

  onMeasureClicked(measure: Measure) {
    this.ngrxStore.dispatch(
      addMeasureToFactor({
        measure,
        factorName: this.data.factorName,
        dimensionName: this.data.dimensionName,
      }),
    );
    this.dialogRef.close();
  }

  openNewMeasureDialog() {
    const dialogRef = this.dialog.open(EditMeasureDialogComponent, {
      minWidth: 300,
      width: '80%',
      data: {
        measure: new Measure(
          '',
          [new Query('', '')],
          new ValueVisualization(''),
          [],
        ),
        service: this.data.service,
        create: true,
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.data.measures.unshift(result);
        this.ngrxStore.dispatch(
          addMeasureToCatalog({ measure: result }),
        );
        // this.measuresChanged.emit(this.data.measures);
      }
    });
  }

  deleteMeasure(measureIndex: number) {
    this.data.measures.splice(measureIndex, 1);
    this.measuresChanged.emit(this.data.measures);
  }
}
