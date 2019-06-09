import {Measure} from '../../success-model/measure';
import {ServiceInformation} from '../store.service';
import {Las2peerService} from '../las2peer.service';
import {ErrorDialogComponent} from '../error-dialog/error-dialog.component';
import {MatDialog} from '@angular/material';
import {Component, OnChanges, OnDestroy, OnInit, SimpleChanges} from '@angular/core';
import {environment} from '../../environments/environment';

export interface VisualizationComponent {
  service: ServiceInformation;
  measure: Measure;
  visualizationInitialized: boolean;
  error: Response;
}

@Component({
  selector: 'app-base-visualization',
  template: ''
})
export class BaseVisualizationComponent implements VisualizationComponent, OnInit, OnChanges, OnDestroy {
  measure: Measure;
  service: ServiceInformation;
  visualizationInitialized = false;
  public serviceNotFoundInMobSOS = false;
  error: Response;
  refreshVisualizationHandle;

  constructor(protected las2peer: Las2peerService, protected dialog: MatDialog) {
  }

  static htmlDecode(input) {
    const doc = new DOMParser().parseFromString(input, 'text/html');
    return doc.documentElement.textContent;
  }

  protected static applyCompatibilityFixForVisualizationService(query: string) {
    // note that the replace value is actually $$SERVICE$$, but each $ must be escaped with another $
    query = query.replace(/\$SERVICE\$/g, '$$$$SERVICE$$$$');
    query = BaseVisualizationComponent.htmlDecode(query);
    return query;
  }

  ngOnInit() {
    this.renderVisualizationReal();
    this.refreshVisualizationHandle = setInterval(
      () => this.renderVisualizationReal(),
      environment.visualizationRefreshInterval * 1000
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.renderVisualizationReal();
  }

  ngOnDestroy(): void {
    clearInterval(this.refreshVisualizationHandle);
  }

  async openErrorDialog() {
    let errorText;
    if (this.error.body) {
      const {value} = await this.error.body.getReader().read();
      const responseBody = new TextDecoder('utf-8').decode(value);
      errorText = (this.error.statusText + ': ' + responseBody).trim();
    } else {
      errorText = this.error;
    }

    this.dialog.open(ErrorDialogComponent, {
      width: '80%',
      data: {error: errorText}
    });
  }

  protected getParamsForQuery(query: string) {
    if (this.service.mobsosIDs.length === 0) {
      // just for robustness
      // should not be called when there are no service IDs stored in MobSOS anyway
      return [];
    }
    const serviceRegex = /\$SERVICE\$/g;
    const matches = query.match(serviceRegex);
    const params = [];
    if (matches) {
      for (const match of matches) {
        // for now we just use the first ID
        // support for multiple IDs is not implemented yet
        params.push(this.service.mobsosIDs[0]);
      }
    }
    return params;
  }

  protected fetchVisualization(query, queryParams, format: string) {
    return this.las2peer.visualizeQuery(query, queryParams, format).then(data => {
      this.error = null;
      return data;
    }).catch(error => this.error = error);
  }

  protected renderVisualizationReal() {
    if (this.service && this.measure) {
      this.visualizationInitialized = true;
      // special case: MobSOS has no knowledge of this service
      // thus we can save the REST call and use null as value
      if (this.service && this.service.mobsosIDs.length > 0) {
        this.renderVisualization();
        this.serviceNotFoundInMobSOS = false;
      } else {
        this.serviceNotFoundInMobSOS = true;
      }
    } else {
      this.visualizationInitialized = false;
    }

  }

  protected async renderVisualization() {
    throw new Error('You have to implement the method renderVisualization!');
  }
}
