import { Measure } from '../../success-model/measure';
import { ServiceInformation } from '../store.service';
import { Las2peerService } from '../las2peer.service';
import { ErrorDialogComponent } from '../error-dialog/error-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import {
  Component,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { environment } from '../../environments/environment';
import { Store } from '@ngrx/store';
import { fetchVisualizationData } from '../services/store.actions';

export interface VisualizationComponent {
  service: ServiceInformation;
  measure: Measure;
  visualizationInitialized: boolean;
  error: Response;
}

@Component({
  selector: 'app-base-visualization',
  template: '',
})
export class BaseVisualizationComponent
  implements VisualizationComponent, OnInit, OnChanges, OnDestroy
{
  constructor(protected ngrxStore: Store, protected dialog: MatDialog) {}
  measure: Measure;
  service: ServiceInformation;
  visualizationInitialized = false;
  public serviceNotFoundInMobSOS = false;
  error: Response;
  refreshVisualizationHandle;

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

  protected applyVariableReplacements(
    query: string,
    service: ServiceInformation
  ) {
    let servicesString = '(';
    const services = [];
    if (!this.service) {
      this.service = service;
    }
    for (const mobsosID of this.service.mobsosIDs) {
      services.push(`"${mobsosID.agentID}"`);
    }
    servicesString += services.join(',') + ')';
    return query.replace('$SERVICES$', servicesString);
  }

  ngOnInit() {}

  ngOnChanges(changes: SimpleChanges): void {}

  ngOnDestroy(): void {}

  async openErrorDialog() {
    let errorText;
    if (this.error.body) {
      const { value } = await this.error.body.getReader().read();
      const responseBody = new TextDecoder('utf-8').decode(value);
      errorText = (this.error.statusText + ': ' + responseBody).trim();
    } else {
      errorText = this.error;
    }

    this.dialog.open(ErrorDialogComponent, {
      width: '80%',
      data: { error: errorText },
    });
  }

  protected getParamsForQuery(query: string) {
    if (!this.service || this.service.mobsosIDs.length === 0) {
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
        params.push(this.service.mobsosIDs.slice(-1)[0].agentID);
      }
    }
    return params;
  }

  protected fetchVisualizationData(query: string, queryParams: string[]) {
    this.ngrxStore.dispatch(fetchVisualizationData({ query, queryParams }));
  }
}
