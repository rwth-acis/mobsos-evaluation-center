import {
  Component,
  ComponentRef,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';
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
  USER_HAS_EDIT_RIGHTS,
} from 'src/app/services/store.selectors';
import {
  editMeasure,
  removeMeasureFromModel,
} from 'src/app/services/store.actions';
import { ConfirmationDialogComponent } from 'src/app/shared/confirmation-dialog/confirmation-dialog.component';
import { ServiceInformation } from 'src/app/models/service.model';
import { Measure } from 'src/app/models/measure.model';
import { EditMeasureDialogComponent } from '../edit-measure-dialog/edit-measure-dialog.component';

@Component({
  selector: 'app-success-measure',
  templateUrl: './success-measure.component.html',
  styleUrls: ['./success-measure.component.scss'],
})
export class SuccessMeasureComponent implements OnInit, OnDestroy {
  @Input() measureName: string;
  @Input() service: ServiceInformation;
  @Input() canDelete = false;
  @Input() dimensionName = '';
  @Input() factorName = '';
  @Input() preview = false;

  measure: Measure;
  measure$: Observable<Measure>;
  subscriptions$: Subscription[] = [];
  canEdit$ = this.ngrxStore.select(USER_HAS_EDIT_RIGHTS);

  public visualizationError: string;
  public error: Response;
  componentRef: ComponentRef<{}>;

  constructor(
    private translate: TranslateService,
    private dialog: MatDialog,
    private ngrxStore: Store,
  ) {}

  ngOnInit() {
    this.measure$ = this.ngrxStore
      .select(MEASURE, this.measureName)
      .pipe(
        filter((measure) => !!measure),
        distinctUntilKeyChanged('queries'),
      );
    const sub = this.measure$
      .pipe(distinctUntilChanged())
      .subscribe((measure) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        this.measure = cloneDeep(measure);
      });
    this.subscriptions$.push(sub);
  }

  ngOnDestroy(): void {
    this.subscriptions$.forEach((sub) => sub.unsubscribe());
  }

  async onEditClicked(event: MouseEvent) {
    const oldMeasureName = this.measure.name;
    const dialogRef = this.dialog.open(EditMeasureDialogComponent, {
      width: '80%',
      maxHeight: '90vh',
      data: {
        measure: this.measure,
        service: this.service,
        create: false,
        dimensionName: this.dimensionName,
        factorName: this.factorName,
      },
    });

    const result = await dialogRef.afterClosed().toPromise();

    if (result) {
      this.ngrxStore.dispatch(
        editMeasure({
          measure: result,
          factorName: this.factorName,
          oldMeasureName,
          dimensionName: this.dimensionName,
          catalogOnly: false,
        }),
      );
      this.measure = {
        ...this.measure,
        name: result.name,
        queries: result.queries,
        visualization: result.visualization,
      } as Measure;
    }

    event.stopPropagation();
  }

  async onDeleteClicked($event: MouseEvent) {
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
