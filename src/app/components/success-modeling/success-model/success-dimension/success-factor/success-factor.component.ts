import {
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';

import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { PickMeasureDialogComponent } from './pick-measure-dialog/pick-measure-dialog.component';

import { TranslateService } from '@ngx-translate/core';
import { Store } from '@ngrx/store';

import { firstValueFrom, Subscription } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
import { ConfirmationDialogComponent } from 'src/app/shared/dialogs/confirmation-dialog/confirmation-dialog.component';
import { SuccessFactor } from 'src/app/models/success.model';
import { ServiceInformation } from 'src/app/models/service.model';

import {
  MEASURES,
  SELECTED_SERVICE,
  USER_HAS_EDIT_RIGHTS,
} from 'src/app/services/store/store.selectors';
import {
  editFactorInDimension,
  removeMeasureFromModel,
} from 'src/app/services/store/store.actions';
import { EditFactorDialogComponent } from '../edit-factor-dialog/edit-factor-dialog.component';
import {
  LimeSurveyMeasure,
  Measure,
  MeasureMap,
} from 'src/app/models/measure.model';

@Component({
  selector: 'app-success-factor',
  templateUrl: './success-factor.component.html',
  styleUrls: ['./success-factor.component.scss'],
})
export class SuccessFactorComponent implements OnInit, OnDestroy {
  @Input() factor: SuccessFactor;
  @Input() dimensionName: string;
  service: ServiceInformation;
  measures: MeasureMap;

  canEdit$ = this.ngrxStore.select(USER_HAS_EDIT_RIGHTS);
  service$ = this.ngrxStore.select(SELECTED_SERVICE);
  measures$ = this.ngrxStore
    .select(MEASURES)
    .pipe(distinctUntilChanged());

  subscriptions$: Subscription[] = [];

  constructor(
    private translate: TranslateService,
    private dialog: MatDialog,
    private ngrxStore: Store,
    private changeDetectorRef: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    let sub = this.measures$.subscribe(
      (measures) => (this.measures = measures),
    );
    this.subscriptions$.push(sub);
    sub = this.service$.subscribe(
      (service) => (this.service = service),
    );
    this.subscriptions$.push(sub);
  }
  ngOnDestroy(): void {
    this.subscriptions$.forEach((sub) => sub.unsubscribe());
  }

  async openRemoveMeasureDialog(measureIndex: number): Promise<void> {
    const message = this.translate.instant(
      'success-factor.remove-measure-prompt',
    ) as string;
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      minWidth: 300,
      data: message,
    });
    const result = await dialogRef.afterClosed().toPromise();
    if (result) {
      this.removeMeasure(measureIndex);
    }
  }

  async openPickMeasureDialog(): Promise<void> {
    this.changeDetectorRef.detach(); // Detach change detection before the dialog opens.
    const dialogRef = this.dialog.open(PickMeasureDialogComponent, {
      minWidth: 300,
      width: '80%',
      data: {
        measures: Object.values(this.measures),
        service: this.service,
        factorName: this.factor.name,
        dimensionName: this.dimensionName,
      },
    });
    const result = await firstValueFrom(dialogRef.afterClosed());
    this.changeDetectorRef.reattach();
    if (result?.name) {
      const name = result.name as string;
      this.factor.measures.push(name);
      this.ngrxStore.dispatch(
        editFactorInDimension({
          factor: this.factor,
          oldFactorName: this.factor.name,
          dimensionName: this.dimensionName,
        }),
      );
    }
  }

  getSuccessMeasures(factor) {
    return factor.measures.filter(
      (m) => this.measures[m].type === 'success',
    );
  }

  getLimesurveyMeasures(factor) {
    return factor.measures.filter(
      (m) => this.measures[m].type === 'limesurvey',
    );
  }

  async onEditClicked(): Promise<void> {
    const dialogRef = this.dialog.open(EditFactorDialogComponent, {
      width: '250px',
      data: { factor: { ...this.factor } },
    });

    const result = await dialogRef.afterClosed().toPromise();
    if (result) {
      this.ngrxStore.dispatch(
        editFactorInDimension({
          factor: result,
          oldFactorName: this.factor.name,
          dimensionName: this.dimensionName,
        }),
      );
      this.factor = result;
    }
  }

  private removeMeasure(measureIndex: number) {
    this.ngrxStore.dispatch(
      removeMeasureFromModel({
        name: this.factor.measures[measureIndex],
      }),
    );
    // this.factor.measures.splice(measureIndex, 1);
    // this.sendFactorToDimension.emit(this.factor);
  }
}
