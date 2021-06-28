import { ErrorDialogComponent } from '../error-dialog/error-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import {
  Component,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { fetchVisualizationData } from '../services/store.actions';
import { ServiceInformation } from '../models/service.model';
import { HttpErrorResponse } from '@angular/common/http';
import { Measure } from '../models/measure.model';
import { Observable } from 'rxjs';
import {
  MEASURE,
  SELECTED_SERVICE,
} from '../services/store.selectors';

export interface VisualizationComponent {
  service: ServiceInformation;
  service$: Observable<ServiceInformation>;
  visualizationInitialized: boolean;
  error: HttpErrorResponse;
  measure: Measure;
}

@Component({
  selector: 'app-base-visualization',
  styleUrls: ['./visualization.component.scss'],
  template: '',
})
export class BaseVisualizationComponent
  implements VisualizationComponent, OnInit, OnDestroy
{
  constructor(
    protected ngrxStore: Store,
    protected dialog: MatDialog,
  ) {}
  measure: Measure;
  service$ = this.ngrxStore.select(SELECTED_SERVICE);
  service: ServiceInformation;
  visualizationInitialized = false;
  public serviceNotFoundInMobSOS = false;
  error: HttpErrorResponse;
  refreshVisualizationHandle;

  static htmlDecode(input) {
    const doc = new DOMParser().parseFromString(input, 'text/html');
    return doc.documentElement.textContent;
  }

  protected static applyCompatibilityFixForVisualizationService(
    query: string,
  ) {
    // note that the replace value is actually $$SERVICE$$, but each $ must be escaped with another $
    if (!query) return;
    query = query?.replace(/\$SERVICE\$/g, '$$$$SERVICE$$$$');
    query = BaseVisualizationComponent.htmlDecode(query);
    return query;
  }

  protected applyVariableReplacements(
    query: string,
    service: ServiceInformation,
  ) {
    let servicesString = '(';
    const services = [];
    if (!this.service) {
      this.service = service;
    }
    if (!this.service?.mobsosIDs) {
      console.error('Service cannot be null');
      return;
    }
    for (const mobsosID of this.service.mobsosIDs) {
      services.push(`"${mobsosID.agentID}"`);
    }
    servicesString += services.join(',') + ')';
    return query?.replace('$SERVICES$', servicesString);
  }

  ngOnInit() {}

  ngOnDestroy(): void {}

  openErrorDialog(error?: HttpErrorResponse) {
    if (error) {
      this.error = error;
    }
    let errorText = 'Http status code: ' + this.error.status + '\n';
    if (this.error.error) {
      errorText += this.error.statusText;

      if (typeof this.error.error === 'string') {
        errorText += ': ' + this.error.error;
      }

      errorText = errorText.trim();
    } else if (typeof this.error === 'string') {
      errorText += this.error;
    }

    this.dialog.open(ErrorDialogComponent, {
      width: '80%',
      data: { error: errorText },
    });
  }

  protected getParamsForQuery(query: string) {
    if (!this.service || this.service?.mobsosIDs?.length === 0) {
      // just for robustness
      // should not be called when there are no service IDs stored in MobSOS anyway
      return [];
    }
    const serviceRegex = /\$SERVICE\$/g;
    const matches = query?.match(serviceRegex);
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

  protected fetchVisualizationData(
    query: string,
    queryParams: string[],
  ) {
    this.ngrxStore.dispatch(
      fetchVisualizationData({ query, queryParams }),
    );
  }
}
