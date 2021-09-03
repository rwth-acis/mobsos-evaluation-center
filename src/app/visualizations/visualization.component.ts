import { ErrorDialogComponent } from '../error-dialog/error-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { fetchVisualizationData } from '../services/store.actions';
import { ServiceInformation } from '../models/service.model';
import { HttpErrorResponse } from '@angular/common/http';
import { Measure } from '../models/measure.model';
import { Observable, Subscription } from 'rxjs';
import { SELECTED_SERVICE } from '../services/store.selectors';
import { distinctUntilKeyChanged, filter } from 'rxjs/operators';

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
  measure: Measure;
  service$ = this.ngrxStore
    .select(SELECTED_SERVICE)
    .pipe(distinctUntilKeyChanged('name'));
  measure$: Observable<Measure>;

  error$: Observable<HttpErrorResponse>;
  subscriptions$: Subscription[] = [];

  service: ServiceInformation;
  visualizationInitialized = false;

  error: HttpErrorResponse;

  constructor(
    protected ngrxStore: Store,
    protected dialog: MatDialog,
  ) {}

  static htmlDecode(input: string): string {
    const doc = new DOMParser().parseFromString(input, 'text/html');
    return doc.documentElement.textContent;
  }

  static applyCompatibilityFixForVisualizationService(
    query: string,
  ): string {
    // note that the replace value is actually $$SERVICE$$, but each $ must be escaped with another $
    if (!query) return;
    query = query?.replace(/\$SERVICE\$/g, '$$$$SERVICE$$$$');
    query = BaseVisualizationComponent.htmlDecode(query);
    return query;
  }

  applyVariableReplacements(
    query: string,
    service: ServiceInformation,
  ): string {
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
  ngOnInit(): void {
    this.service$
      .pipe(filter((service) => !!service))
      .subscribe((service) => {
        this.service = service;
      });

    const sub = this.error$.subscribe((err) => (this.error = err));
    this.subscriptions$.push(sub);
  }

  /** Note that lifecycle hooks are not called by components
   * which inherit from this class
   * Thus we need to unsubscribe from all subscriptions in the component itself
   * as mentioned on @link https://medium.com/@saniyusuf/part-1-the-case-for-component-inheritance-in-angular-a34fe2a0f7ac
   */
  ngOnDestroy(): void {
    this.subscriptions$.forEach((subscription) =>
      subscription.unsubscribe(),
    );
  }

  openErrorDialog(error?: HttpErrorResponse): void {
    if (error) {
      this.error = error;
    }
    let errorText =
      'Http status code: ' + this.error.status.toString() + '\n';
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
}
