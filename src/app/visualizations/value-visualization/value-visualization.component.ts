import { Component, Input, OnChanges, OnDestroy, OnInit } from '@angular/core';
import {
  BaseVisualizationComponent,
  VisualizationComponent,
} from '../visualization.component';
import { Las2peerService } from '../../las2peer.service';
import { MatDialog } from '@angular/material/dialog';
import { Measure } from 'src/success-model/measure';
import { ServiceInformation } from 'src/app/store.service';
import { Store } from '@ngrx/store';
import { VISUALIZATION_DATA_FOR_QUERY } from 'src/app/services/store.selectors';
import { Observable } from 'rxjs';
import { VData } from 'src/app/models/visualization.model';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-value-visualization',
  templateUrl: './value-visualization.component.html',
  styleUrls: ['./value-visualization.component.scss'],
})
export class ValueVisualizationComponent
  extends BaseVisualizationComponent
  implements VisualizationComponent, OnInit, OnChanges, OnDestroy
{
  value: string = null;
  @Input() measure: Measure;
  @Input() service: ServiceInformation;
  value$: Observable<any[][]>;

  constructor(dialog: MatDialog, protected ngrxStore: Store) {
    super(ngrxStore, dialog);
  }

  async ngOnInit() {
    let query = this.measure.queries[0].sql;

    const queryParams = this.getParamsForQuery(query);
    query = this.applyVariableReplacements(query, this.service);
    query =
      BaseVisualizationComponent.applyCompatibilityFixForVisualizationService(
        query
      );
    super.fetchVisualizationData(query, queryParams);
    this.value$ = this.ngrxStore.select(VISUALIZATION_DATA_FOR_QUERY, query);
    this.value$.pipe(filter((data) => !!data)).subscribe((data) => {
      this.value = data.slice(-1)[0].length === 0 ? 0 : data.slice(-1)[0][0];
      this.visualizationInitialized = true;
    });
  }
}
