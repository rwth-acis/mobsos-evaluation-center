import {
  Component,
  ComponentFactoryResolver,
  ComponentRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';

import { ServiceInformation } from '../store.service';
import { Las2peerService } from '../las2peer.service';
import { DomSanitizer } from '@angular/platform-browser';
import { VisualizationDirective } from '../visualization.directive';
import { ValueVisualizationComponent } from '../visualizations/value-visualization/value-visualization.component';
import { VisualizationComponent } from '../visualizations/visualization.component';
import { KpiVisualizationComponent } from '../visualizations/kpi-visualization/kpi-visualization.component';
import { ChartVisualizationComponent } from '../visualizations/chart-visualization/chart-visualization.component';
import { EditMeasureDialogComponent } from '../success-factor/edit-measure-dialog/edit-measure-dialog.component';
import { MatDialog } from '@angular/material/dialog';

import { SuccessMeasureInterface } from './success-measure.interface';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import { TranslateService } from '@ngx-translate/core';
import { Store } from '@ngrx/store';
import { EDIT_MODE, MEASURE } from '../services/store.selectors';
import { editMeasure } from '../services/store.actions';
import { Measure } from '../models/measure.model';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-success-measure',
  templateUrl: './success-measure.component.html',
  styleUrls: ['./success-measure.component.scss'],
})
export class SuccessMeasureComponent
  implements SuccessMeasureInterface, OnInit, OnChanges, OnDestroy
{
  @ViewChild(VisualizationDirective) visualizationHost: VisualizationDirective;
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
  private visualizationType: string;

  constructor(
    private las2peer: Las2peerService,
    private translate: TranslateService,
    private sanitizer: DomSanitizer,
    private componentFactoryResolver: ComponentFactoryResolver,
    private dialog: MatDialog,
    private ngrxStore: Store
  ) {}

  ngOnInit() {
    this.measure = { ...this.measure } as Measure;

    this.refreshVisualization();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.measure$ = this.ngrxStore.select(MEASURE, this.measure.name);

    this.relayPropertiesToVisualizationComponent();
    if (Object.keys(changes).includes('editMode')) {
      this.onResize();
    }
  }

  ngOnDestroy(): void {}

  refreshVisualization(force = false) {
    if (
      force ||
      (this.measure &&
        this.measure.visualization.type !== this.visualizationType)
    ) {
      if (this.componentRef) {
        this.componentRef.destroy();
      }
      let componentFactory;
      const visualization = this.measure.visualization;
      if (visualization.type === 'Value') {
        componentFactory =
          this.componentFactoryResolver.resolveComponentFactory(
            ValueVisualizationComponent
          );
      } else if (visualization.type === 'Chart') {
        componentFactory =
          this.componentFactoryResolver.resolveComponentFactory(
            ChartVisualizationComponent
          );
      } else if (visualization.type === 'KPI') {
        componentFactory =
          this.componentFactoryResolver.resolveComponentFactory(
            KpiVisualizationComponent
          );
      } else {
        this.visualizationError = `The visualization type ${visualization.type} is not supported yet.`;
        return;
      }
      return;
      const viewContainerRef = this.visualizationHost?.viewContainerRef;
      if (!viewContainerRef) {
        return this.relayPropertiesToVisualizationComponent();
      }
      viewContainerRef.clear();
      this.componentRef = viewContainerRef.createComponent(componentFactory);
      this.relayPropertiesToVisualizationComponent();
      this.visualizationError = null;
      this.visualizationType = this.measure.visualization.type;
    }
  }

  onEditClicked(event: MouseEvent) {
    const dialogRef = this.dialog.open(EditMeasureDialogComponent, {
      minWidth: 300,
      width: '80%',
      data: {
        measure: { ...this.measure },
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
          })
        );
        this.measure.name = result.name;
        this.measure.queries = result.queries;
        this.measure.visualization = result.visualization;
        // this.rerenderVisualizationComponent();
        // this.measureChange.emit(this.measure);
      }
    });
    event.stopPropagation();
  }

  public rerenderVisualizationComponent() {
    if (this.componentRef) {
      (
        this.componentRef.instance as VisualizationComponent
      ).renderVisualization();
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    // chart visualization do not behave correctly when decreasing the available width so we reinitialize it
    if (this.visualizationType === 'Chart') {
      this.refreshVisualization(true);
    }
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
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.measureDelete.emit();
      }
    });
    event.stopPropagation();
  }
}
