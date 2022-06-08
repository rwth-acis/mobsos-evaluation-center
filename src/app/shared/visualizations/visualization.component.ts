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

  fetchVisualizationData(
    query: string,
    ngrxStore: Store<any>,
    cache: boolean = true,
  ): void {
    ngrxStore.dispatch(fetchVisualizationData({ query, cache }));
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
