import { MatDialog } from '@angular/material/dialog';
import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { Store } from '@ngrx/store';

import { HttpErrorResponse } from '@angular/common/http';

import { map, Observable } from 'rxjs';

import { ServiceInformation } from 'src/app/models/service.model';
import { Measure } from 'src/app/models/measure.model';
import { fetchVisualizationData } from 'src/app/services/store/store.actions';
import { ErrorDialogComponent } from './error-dialog/error-dialog.component';

@Component({
  selector: 'app-visualization',
  styleUrls: ['./visualization.component.scss'],
  templateUrl: './visualization.component.html',
})
export class VisualizationComponent implements OnInit {
  @Input() measure$: Observable<Measure>;

  @Output() isLoading: EventEmitter<any> = new EventEmitter();

  measure: Measure;

  error$: Observable<HttpErrorResponse>;
  service: ServiceInformation;
  visualizationInitialized = false;
  visualizationType$: Observable<any>;

  constructor(protected dialog: MatDialog) {}

  static htmlDecode(input: string): string {
    const doc = new DOMParser().parseFromString(input, 'text/html');
    return doc.documentElement.textContent || '';
  }

  ngOnInit(): void {
    this.visualizationType$ = this.measure$.pipe(
      map((m) => m.visualization.type as string),
    );
  }

  applyVariableReplacements(
    query: string,
    service: ServiceInformation,
  ): string {
    if (!this.service) {
      this.service = service;
    }
    if (query?.includes('$SERVICES$')) {
      let servicesString = '(';
      const services = [];

      if (!this.service?.mobsosIDs) {
        console.error('Service agent id cannot be null');
        return query;
      }
      for (const mobsosID of Object.keys(this.service.mobsosIDs)) {
        services.push(`"${mobsosID}"`);
      }
      servicesString += services.join(',') + ')';
      return query?.replace('$SERVICES$', servicesString);
    } else if (query?.includes('$SERVICE$')) {
      if (!(Object.keys(this.service.mobsosIDs).length > 0)) {
        console.error('Service agent id cannot be null');
        return query;
      }
      // for now we use the id which has the greatest registrationTime as this is the agent ID
      // of the most recent service agent started in las2peer
      const maxIndex = Object.values(this.service.mobsosIDs).reduce(
        (max, time, index) => {
          return time > max ? index : max;
        },
        0,
      );

      return query?.replace(
        '$SERVICE$',
        ` ${Object.keys(this.service.mobsosIDs)[maxIndex]} `,
      );
    } else return query;
  }

  getParamsForQuery(query: string): string[] {
    if (
      !this.service?.mobsosIDs ||
      this.service.mobsosIDs.length === 0
    ) {
      // just for robustness
      // should not be called when there are no service IDs stored in MobSOS anyway
      return [];
    }
    const serviceRegex = /\$SERVICE\$/g;
    const matches = query?.match(serviceRegex);
    const params = [];
    if (matches) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for (const match of matches) {
        // for now we use the id which has the greatest registrationTime as this is the agent ID
        // of the most recent service agent started in las2peer
        const maxIndex = Object.values(this.service.mobsosIDs).reduce(
          (max, time, index) => {
            return time > max ? index : max;
          },
          0,
        );

        params.push(Object.keys(this.service.mobsosIDs)[maxIndex]);
      }
    }
    return params as string[];
  }

  fetchVisualizationData(
    query: string,
    queryParams: string[],
    ngrxStore: Store<any>,
    cache: boolean = true,
  ): void {
    ngrxStore.dispatch(
      fetchVisualizationData({ query, queryParams, cache }),
    );
  }

  /** Note that lifecycle hooks are not called by components
   * which inherit from this class
   * Thus we need to unsubscribe from all subscriptions in the component itself
   * as mentioned on @link https://medium.com/@saniyusuf/part-1-the-case-for-component-inheritance-in-angular-a34fe2a0f7ac
   */

  openErrorDialog(
    error?: HttpErrorResponse | { error: SyntaxError } | string,
  ): void {
    let errorText = 'Unknown error';
    if (error instanceof HttpErrorResponse) {
      errorText =
        'Http status code: ' + error.status?.toString() + '\n';
      errorText += error.statusText;
      if (typeof error.error === 'string') {
        errorText += ': ' + error.error;
      }
    } else if (
      typeof error === 'object' &&
      Object.keys(error).includes('error')
    ) {
      errorText = (error as { error: SyntaxError }).error.message;
    } else if (typeof error === 'string') {
      errorText = error;
    }
    errorText = errorText?.trim();
    this.dialog.open(ErrorDialogComponent, {
      width: '80%',
      data: { error: errorText },
    });
  }
  setLoading(loading: boolean) {
    this.isLoading.emit(loading);
  }
}
export function applyCompatibilityFixForVisualizationService(
  query: string,
): string {
  // note that the replace value is actually $$SERVICE$$, but each $ must be escaped with another $
  if (!query) return '';
  query = query?.replace(/\$SERVICE\$/g, '$$$$SERVICE$$$$');
  query = VisualizationComponent.htmlDecode(query);
  return query;
}
