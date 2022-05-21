import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { cloneDeep } from 'lodash-es';

import { MatDialog } from '@angular/material/dialog';

import { TranslateService } from '@ngx-translate/core';
import { Store } from '@ngrx/store';

import { Observable, Subscription } from 'rxjs';

import {
  distinctUntilChanged,
  distinctUntilKeyChanged,
  filter,
} from 'rxjs/operators';
import {
  MEASURE,
  SELECTED_SERVICE,
  USER_HAS_EDIT_RIGHTS,
} from 'src/app/services/store/store.selectors';
import {
  editMeasure,
  removeMeasureFromModel,
} from 'src/app/services/store/store.actions';
import { ServiceInformation } from 'src/app/models/service.model';
import { Measure } from 'src/app/models/measure.model';
import { EditMeasureDialogComponent } from '../edit-measure-dialog/edit-measure-dialog.component';
import { ConfirmationDialogComponent } from 'src/app/shared/dialogs/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-success-measure',
  templateUrl: './success-measure.component.html',
  styleUrls: ['./success-measure.component.scss'],
})
export class SuccessMeasureComponent implements OnInit, OnDestroy {
  @Input() measureName: string;
  @Input() dimensionName = '';
  @Input() factorName = '';
  @Input() preview = false;

  measure$: Observable<Measure>;
  service$: Observable<ServiceInformation> =
    this.ngrxStore.select(SELECTED_SERVICE);
  subscriptions$: Subscription[] = [];
  canEdit$ = this.ngrxStore.select(USER_HAS_EDIT_RIGHTS);
  service: ServiceInformation;
  measure: Measure;

  constructor(
    private translate: TranslateService,
    private dialog: MatDialog,
    private ngrxStore: Store,
  ) {}

  ngOnInit(): void {
    this.measure$ = this.ngrxStore
      .select(MEASURE({ measureName: this.measureName }))
      .pipe(
        filter((measure) => !!measure),
        distinctUntilKeyChanged('queries'),
      );
    let sub = this.measure$
      .pipe(distinctUntilChanged())
      .subscribe((measure) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        this.measure = cloneDeep(measure);
      });
    this.subscriptions$.push(sub);
    sub = this.service$.subscribe(
      (service) => (this.service = service),
    );
    this.subscriptions$.push(sub);
  }

  ngOnDestroy(): void {
    this.subscriptions$.forEach((sub) => sub.unsubscribe());
  }

  async onEditClicked(event: MouseEvent): Promise<void> {
    const oldMeasureName = this.measure.name;
    const dialogRef = this.dialog.open(EditMeasureDialogComponent, {
      width: '80vw',
      height: '80vh',
      data: {
        measure: this.measure,
        service: this.service,
        create: false,
        dimensionName: this.dimensionName,
        factorName: this.factorName,
      },
    });

    const updatedMeasure = await dialogRef.afterClosed().toPromise();

    if (updatedMeasure) {
      this.ngrxStore.dispatch(
        editMeasure({
          measure: updatedMeasure,
          factorName: this.factorName,
          oldMeasureName,
          dimensionName: this.dimensionName,
          catalogOnly: false,
        }),
      );
      this.measure = {
        ...this.measure,
        ...updatedMeasure,
      } as Measure;
    }

    event.stopPropagation();
  }

  async onDeleteClicked($event: MouseEvent): Promise<void> {
    const message = this.translate.instant(
      'success-factor.remove-measure-prompt',
    );
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      minWidth: 300,
      data: message,
    });
    const measure = this.measure;
    const result = await dialogRef.afterClosed().toPromise();
    if (result) {
      this.ngrxStore.dispatch(
        removeMeasureFromModel({ name: measure.name }),
      );
      // this.measureDelete.emit();
    }
    $event.stopPropagation();
  }
}
