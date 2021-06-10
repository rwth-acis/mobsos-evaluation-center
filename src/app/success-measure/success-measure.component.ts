import {
  Component,
  ComponentRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { cloneDeep } from 'lodash';

import { EditMeasureDialogComponent } from '../success-factor/edit-measure-dialog/edit-measure-dialog.component';
import { MatDialog } from '@angular/material/dialog';

import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import { TranslateService } from '@ngx-translate/core';
import { Store } from '@ngrx/store';
import { EDIT_MODE, MEASURE } from '../services/store.selectors';
import {
  editMeasure,
  removeMeasure,
} from '../services/store.actions';
import { Measure } from '../models/measure.model';
import { Observable } from 'rxjs';
import { ServiceInformation } from '../models/service.model';

@Component({
  selector: 'app-success-measure',
  templateUrl: './success-measure.component.html',
  styleUrls: ['./success-measure.component.scss'],
})
export class SuccessMeasureComponent
  implements OnInit, OnChanges, OnDestroy
{
  @Input() measure: Measure;
  @Input() service: ServiceInformation;
  @Input() editMode = false;
  @Input() canDelete = false;
  @Input() dimensionName = '';
  @Input() factorName = '';
  @Output() measureChange = new EventEmitter<Measure>();
  @Output() measureDelete = new EventEmitter();
  meaureName: string;
  measure$: Observable<Measure>;

  editMode$ = this.ngrxStore.select(EDIT_MODE);

  public visualizationError: string;
  public error: Response;
  componentRef: ComponentRef<{}>;

  constructor(
    private translate: TranslateService,

    private dialog: MatDialog,
    private ngrxStore: Store,
  ) {}

  ngOnInit() {
    this.measure = cloneDeep(this.measure) as Measure;
    // this.measure = this.measure
    //   ? (JSON.parse(JSON.stringify(this.measure)) as Measure)
    //   : this.measure;

    this.measure$ = this.ngrxStore.select(
      MEASURE,
      this.measure?.name,
    );
  }

  ngOnChanges(changes: SimpleChanges): void {}

  ngOnDestroy(): void {}

  onEditClicked(event: MouseEvent) {
    const dialogRef = this.dialog.open(EditMeasureDialogComponent, {
      minWidth: 300,
      width: '80%',
      data: {
        measure: cloneDeep(this.measure),
        service: this.service,
        create: false,
        dimensionName: this.dimensionName,
        factorName: this.factorName,
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.ngrxStore.dispatch(
          editMeasure({
            measure: result,
            factorName: this.factorName,
            oldMeasureName: this.measure.name,
            dimensionName: this.dimensionName,
          }),
        );
        this.measure.name = result.name;
        this.measure.queries = result.queries;
        this.measure.visualization = result.visualization;
      }
    });
    event.stopPropagation();
  }

  public rerenderVisualizationComponent() {
    // if (this.componentRef) {
    //   (
    //     this.componentRef.instance as VisualizationComponent
    //   ).renderVisualization();
    // }
  }

  private relayPropertiesToVisualizationComponent() {
    // if (this.componentRef) {
    //   (this.componentRef.instance as VisualizationComponent).service =
    //     this.service;
    //   (this.componentRef.instance as VisualizationComponent).measure =
    //     this.measure;
    // }
  }

  async onDeleteClicked($event: MouseEvent) {
    const message = await this.translate
      .get('success-factor.remove-measure-prompt')
      .toPromise();
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      minWidth: 300,
      data: message,
    });
    const measure = this.measure;
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.ngrxStore.dispatch(
          removeMeasure({ name: measure.name }),
        );
        // this.measureDelete.emit();
      }
    });
    $event.stopPropagation();
  }
}
