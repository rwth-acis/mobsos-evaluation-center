import {Component, OnChanges, OnDestroy, OnInit} from '@angular/core';
import {BaseVisualizationComponent, VisualizationComponent} from '../visualization.component';
import {Las2peerService} from '../../las2peer.service';
import {MatDialog} from '@angular/material';

@Component({
  selector: 'app-value-visualization',
  templateUrl: './value-visualization.component.html',
  styleUrls: ['./value-visualization.component.scss']
})
export class ValueVisualizationComponent extends BaseVisualizationComponent
  implements VisualizationComponent, OnInit, OnChanges, OnDestroy {
  value: string = null;

  constructor(las2peer: Las2peerService, dialog: MatDialog) {
    super(las2peer, dialog);
  }

  async renderVisualization() {
    let query = this.measure.queries[0].sql;
    const queryParams = this.getParamsForQuery(query);
    query = BaseVisualizationComponent.applyCompatibilityFixForVisualizationService(query);
    this.fetchVisualization(query, queryParams, 'JSON').then(result => {
      const data = result;
      this.value = data.slice(-1)[0].length === 0 ? 0 : data.slice(-1)[0][0];
      this.visualizationInitialized = true;
    });
  }
}
