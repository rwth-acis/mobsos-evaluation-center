import {
  Component,
  EventEmitter,
  Inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';

import { EditMeasureDialogComponent } from '../edit-measure-dialog/edit-measure-dialog.component';

import { Store } from '@ngrx/store';
import {
  addMeasureToCatalog,
  addMeasureToFactor,
  editMeasure,
  editMeasureInCatalog,
} from 'src/app/services/store.actions';
import { Measure } from 'src/app/models/measure.model';
import { ValueVisualization } from 'src/app/models/visualization.model';
import { ServiceInformation } from 'src/app/models/service.model';
import { Query } from 'src/app/models/query.model';
import { MatAccordion } from '@angular/material/expansion';
import { isEmpty } from 'lodash-es';
import {
  MEASURE,
  MEASURES,
  SELECTED_SERVICE,
  USER_HAS_EDIT_RIGHTS,
} from 'src/app/services/store.selectors';
import { ConfirmationDialogComponent } from 'src/app/confirmation-dialog/confirmation-dialog.component';
import { TranslateService } from '@ngx-translate/core';
import { map, tap } from 'rxjs/operators';

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
  @ViewChild(MatAccordion) accordion: MatAccordion;

  measuresChanged = new EventEmitter<Measure[]>();
  canEdit$ = this.ngrxStore.select(USER_HAS_EDIT_RIGHTS);
  service$ = this.ngrxStore.select(SELECTED_SERVICE);
  measures$ = this.ngrxStore.select(MEASURES).pipe(
    map((measures) =>
      !isEmpty(measures) ? Object.values(measures) : [],
    ),
    map((measures) => (measures?.length > 0 ? measures : undefined)),
  );
  service: ServiceInformation;

  constructor(
    private dialogRef: MatDialogRef<PickMeasureDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private dialog: MatDialog,
    private ngrxStore: Store,
    private translate: TranslateService,
  ) {}

  ngOnInit() {
    this.service$.subscribe((service) => (this.service = service));
  }

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

  async openNewMeasureDialog() {
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
    const result = await dialogRef.afterClosed().toPromise();
    if (result) {
      this.data.measures.unshift(result);
      this.ngrxStore.dispatch(
        addMeasureToCatalog({ measure: result }),
      );
      // this.measuresChanged.emit(this.data.measures);
    }
  }

  async onEditClicked(measure: Measure) {
    const dialogRef = this.dialog.open(EditMeasureDialogComponent, {
      minWidth: 300,
      width: '80%',
      data: {
        measure,
        service: this.service,
        create: false,
      },
    });
    const result = await dialogRef.afterClosed().toPromise();
    if (result) {
      this.ngrxStore.dispatch(
        editMeasureInCatalog({
          measure: result,
          oldMeasureName: measure.name,
        }),
      );
    }
  }

  async deleteMeasure(measureIndex: number) {
    const message = this.translate.instant(
      'success-factor.remove-measure-prompt',
    );
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      minWidth: 300,
      data: message,
    });
    const result = await dialogRef.afterClosed().toPromise();
    if (result) {
      this.data.measures.splice(measureIndex, 1);
      this.measuresChanged.emit(this.data.measures);
    }
  }
}
