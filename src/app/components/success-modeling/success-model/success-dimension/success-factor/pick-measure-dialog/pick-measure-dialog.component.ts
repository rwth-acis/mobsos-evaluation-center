import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA,
  MatLegacyDialog as MatDialog,
  MatLegacyDialogRef as MatDialogRef,
} from '@angular/material/legacy-dialog';

import { EditMeasureDialogComponent } from '../edit-measure-dialog/edit-measure-dialog.component';

import { Store } from '@ngrx/store';
import {
  addMeasureToCatalog,
  addMeasureToFactor,
  editMeasureInCatalog,
  removeMeasureFromCatalog,
} from 'src/app/services/store/store.actions';
import {
  IMeasure,
  Measure,
  SQLQuery,
} from 'src/app/models/measure.model';
import { ValueVisualization } from 'src/app/models/visualization.model';
import { ServiceInformation } from 'src/app/models/service.model';
import { MatAccordion } from '@angular/material/expansion';
import { isEmpty } from 'lodash-es';
import {
  MEASURES,
  SELECTED_SERVICE,
  USER_HAS_EDIT_RIGHTS,
} from 'src/app/services/store/store.selectors';
import { ConfirmationDialogComponent } from 'src/app/shared/dialogs/confirmation-dialog/confirmation-dialog.component';
import { TranslateService } from '@ngx-translate/core';
import { map, startWith } from 'rxjs/operators';
import { UntypedFormControl } from '@angular/forms';
import {
  combineLatest,
  firstValueFrom,
  Observable,
  Subscription,
} from 'rxjs';

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
export class PickMeasureDialogComponent implements OnInit, OnDestroy {
  @ViewChild(MatAccordion) accordion: MatAccordion;
  input = new UntypedFormControl('');

  measuresChanged = new EventEmitter<Measure[]>();
  canEdit$ = this.ngrxStore.select(USER_HAS_EDIT_RIGHTS);
  service$ = this.ngrxStore.select(SELECTED_SERVICE);
  measures$ = this.ngrxStore.select(MEASURES).pipe(
    map((measures) =>
      !isEmpty(measures) ? Object.values(measures) : [],
    ),
    map((measures) => (measures?.length > 0 ? measures : undefined)),
    map((measures) =>
      measures?.sort((a, b) => a.name?.localeCompare(b.name)),
    ),
  );
  filteredMeasures$ = combineLatest([
    this.measures$,
    this.input.valueChanges.pipe(startWith('')),
  ]).pipe(
    map(([measures, input]: [Measure[], string]) =>
      input?.trim().length > 0
        ? measures.filter((measure) =>
            measure.name
              ?.toLowerCase()
              .includes(input?.toLowerCase()),
          )
        : measures,
    ),
  );
  service: ServiceInformation;
  subscriptions$: Subscription[] = [];

  constructor(
    private dialogRef: MatDialogRef<PickMeasureDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private dialog: MatDialog,
    private ngrxStore: Store,
    private changeDetectorRef: ChangeDetectorRef,
    private translate: TranslateService,
  ) {}

  ngOnInit() {
    const sub = this.service$.subscribe(
      (service) => (this.service = service),
    );
    this.subscriptions$.push(sub);
  }

  ngOnDestroy() {
    this.subscriptions$.forEach((sub) => sub.unsubscribe());
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
    this.changeDetectorRef.detach(); // Detach change detection before the dialog opens.
    const dialogRef = this.dialog.open(EditMeasureDialogComponent, {
      width: '80vw',
      height: '80vh',
      data: {
        measure: new Measure(
          '',
          [new SQLQuery('', '')],
          new ValueVisualization(''),
          [],
        ),
        service: this.data.service,
        create: true,
      },
    });
    const newMeasure: Measure = await firstValueFrom(
      dialogRef.afterClosed(),
    );
    this.changeDetectorRef.reattach();
    if (newMeasure) {
      this.data.measures.unshift(newMeasure);
      this.ngrxStore.dispatch(
        addMeasureToCatalog({ measure: newMeasure }),
      );
      // this.measuresChanged.emit(this.data.measures);
    }
  }

  async onEditClicked(measure: Measure) {
    const dialogRef = this.dialog.open(EditMeasureDialogComponent, {
      width: '80vw',
      height: '80vh',
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

  getMeasureObservableByIndex(index: number): Observable<IMeasure> {
    return this.measures$.pipe(map((measures) => measures[index]));
  }

  isLimeSurveyMeasure(measure: IMeasure) {
    return 'sid' in measure;
  }

  async deleteMeasure(measure: Measure) {
    const message = this.translate.instant(
      'success-factor.remove-measure-prompt',
    );
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      minWidth: 300,
      data: message,
    });
    const result = await dialogRef.afterClosed().toPromise();
    if (result) {
      this.ngrxStore.dispatch(
        removeMeasureFromCatalog({ name: measure.name }),
      );
    }
  }
}
