import { MatDialog } from '@angular/material/dialog';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';

import { HttpErrorResponse } from '@angular/common/http';

import { Observable } from 'rxjs';

import { distinctUntilKeyChanged } from 'rxjs/operators';
import { ServiceInformation } from 'src/app/models/service.model';
import { Measure } from 'src/app/models/measure.model';
import { SELECTED_SERVICE } from 'src/app/services/store.selectors';
import { fetchVisualizationData } from 'src/app/services/store.actions';
import { ErrorDialogComponent } from './error-dialog/error-dialog.component';

@Component({
  selector: 'app-visualization',
  styleUrls: ['./visualization.component.scss'],
  templateUrl: './visualization.component.html',
})
export class VisualizationComponent implements OnInit, OnDestroy {
  @Input() measure$: Observable<Measure>;
  measure: Measure;
  service$ = this.ngrxStore
    .select(SELECTED_SERVICE)
    .pipe(distinctUntilKeyChanged('name'));

  error$: Observable<HttpErrorResponse>;

  service: ServiceInformation;
  visualizationInitialized = false;

  constructor(
    protected ngrxStore: Store,
    protected dialog: MatDialog,
  ) {}

  static htmlDecode(input: string): string {
    const doc = new DOMParser().parseFromString(input, 'text/html');
    return doc.documentElement.textContent;
  }

  applyVariableReplacements(
    query: string,
    service: ServiceInformation,
  ): string {
    if (query?.includes('$SERVICES$')) {
      let servicesString = '(';
      const services = [];
      if (!this.service) {
        this.service = service;
      }
      if (!service?.mobsosIDs) {
        console.error('Service agent id cannot be null');
        return query;
      }
      for (const mobsosID of service.mobsosIDs) {
        services.push(`"${mobsosID.agentID}"`);
      }
      servicesString += services.join(',') + ')';
      return query?.replace('$SERVICES$', servicesString);
    } else if (query?.includes('$SERVICE$')) {
      if (!(service?.mobsosIDs.length > 0)) {
        console.error('Service agent id cannot be null');
        return query;
      }

      return query?.replace(
        '$SERVICE$',
        ` ${service.mobsosIDs[0].agentID} `,
      );
    } else return query;
  }

  getParamsForQuery(query: string): string[] {
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
    return params as string[];
  }

  fetchVisualizationData(query: string, queryParams: string[]): void {
    this.ngrxStore.dispatch(
      fetchVisualizationData({ query, queryParams }),
    );
  }

  /** Note that lifecycle hooks are not called by components
   * which inherit from this class
   * Thus we need to unsubscribe from all subscriptions in the component itself
   * as mentioned on @link https://medium.com/@saniyusuf/part-1-the-case-for-component-inheritance-in-angular-a34fe2a0f7ac
   */
  ngOnDestroy(): void {}
  ngOnInit(): void {}
  openErrorDialog(error?: HttpErrorResponse | string): void {
    let errorText = 'Unknown error';
    if (error instanceof HttpErrorResponse) {
      errorText =
        'Http status code: ' + error.status?.toString() + '\n';
      errorText += error.statusText;
      if (typeof error.error === 'string') {
        errorText += ': ' + error.error;
      }
    } else if (typeof error === 'string') {
      errorText = error;
    }
    errorText = errorText?.trim();
    this.dialog.open(ErrorDialogComponent, {
      width: '80%',
      data: { error: errorText },
    });
  }
}
export function applyCompatibilityFixForVisualizationService(
  query: string,
): string {
  // note that the replace value is actually $$SERVICE$$, but each $ must be escaped with another $
  if (!query) return;
  query = query?.replace(/\$SERVICE\$/g, '$$$$SERVICE$$$$');
  query = VisualizationComponent.htmlDecode(query);
  return query;
}
