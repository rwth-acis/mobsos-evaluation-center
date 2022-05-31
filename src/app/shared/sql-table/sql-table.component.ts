import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';

import { Observable, of, Subscription } from 'rxjs';
import {
  distinctUntilChanged,
  filter,
  map,
  shareReplay,
  startWith,
  switchMap,
  tap,
} from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { ServiceInformation } from 'src/app/models/service.model';
import { fetchVisualizationData } from 'src/app/services/store/store.actions';
import { VISUALIZATION_DATA_FOR_QUERY } from 'src/app/services/store/store.selectors';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { HttpErrorResponse } from '@angular/common/http';
import { ErrorDialogComponent } from '../visualizations/error-dialog/error-dialog.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-sql-table',
  templateUrl: './sql-table.component.html',
  styleUrls: ['./sql-table.component.scss'],
})
export class SqlTableComponent
  implements OnInit, OnDestroy, AfterViewInit
{
  @Input() service: ServiceInformation;
  @Input() query$: Observable<string>;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @Output() isLoading: EventEmitter<any> = new EventEmitter();

  queryParams: string[];
  vdata$: Observable<any[][]>;
  loading$: Observable<boolean> = of(true);

  subscriptions$: Subscription[] = [];
  // eslint-disable-next-line @typescript-eslint/ban-types
  dataSource$: Observable<MatTableDataSource<{}>>;
  displayedColumns$: Observable<any>;
  error$: Observable<HttpErrorResponse>;
  constructor(private ngrxStore: Store, private dialog: MatDialog) {}

  static htmlDecode(input: string) {
    const doc = new DOMParser().parseFromString(input, 'text/html');
    return doc.documentElement.textContent;
  }

  protected static applyCompatibilityFixForVisualizationService(
    query: string,
  ): string {
    if (!query) return null;
    // note that the replace value is actually $$SERVICE$$, but each $ must be escaped with another $
    query = query?.replace(/\$SERVICE\$/g, '$$$$SERVICE$$$$');
    query = SqlTableComponent.htmlDecode(query);
    return query;
  }

  ngOnInit() {
    const storeData$ = this.query$.pipe(
      map((query) =>
        SqlTableComponent.applyCompatibilityFixForVisualizationService(
          query,
        ),
      ),
      tap((query) =>
        this.ngrxStore.dispatch(fetchVisualizationData({ query })),
      ),
      switchMap((query) =>
        this.ngrxStore.select(
          VISUALIZATION_DATA_FOR_QUERY({ queryString: query }),
        ),
      ),
      distinctUntilChanged(),
      shareReplay(1),
    );

    this.vdata$ = storeData$.pipe(map((vdata) => vdata?.data));
    this.error$ = storeData$.pipe(map((vdata) => vdata?.error));
    this.loading$ = storeData$.pipe(
      map((vdata) => !vdata || vdata?.loading),
      startWith(true),
    );
    const sub = this.loading$.subscribe((loading) => {
      this.isLoading.emit(loading);
    });
    this.subscriptions$.push(sub);
    this.dataSource$ = this.vdata$.pipe(
      filter((data) => !!data),
      map((data) => this.getTableDataSource(data)),
    );
    this.displayedColumns$ = this.vdata$.pipe(
      filter((data) => !!data),
      map((data) => this.getDisplayedColumns(data)),
    );
  }

  ngOnDestroy() {
    this.subscriptions$.forEach((sub) => sub.unsubscribe());
  }

  ngAfterViewInit(): void {
    this.dataSource$ = this.dataSource$.pipe(
      filter((data) => !!data),
      map((dataSource) => {
        dataSource.sort = this.sort;
        dataSource.paginator = this.paginator;
        return dataSource;
      }),
    );
  }

  getDisplayedColumns(rawData: any[][]): string[] {
    if (!rawData) {
      return null;
    }
    const displayedColumns = [...(rawData[0] as string[])]; // contains the labels
    for (let i = 0; i < rawData[1].length; i++) {
      displayedColumns[i] =
        displayedColumns[i] + ` (type: ${rawData[1][i] as string})`; // add type of the column
    }
    return displayedColumns;
  }

  getTableDataSource(rawData: any[][]) {
    if (!(rawData?.length > 2)) {
      return null;
    }
    const displayedColumns = this.getDisplayedColumns(rawData);

    const src = rawData.slice(2).map((row) => {
      // for the table we need to transform each row in our array to an object with the corresponding label as key
      const obj = {};
      for (let index = 0; index < row.length; index++) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        obj[displayedColumns[index]] = row[index];
      }
      return obj;
    });

    const dataSource = new MatTableDataSource(src);
    return dataSource;
  }

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
    } else if (Object.keys(error).includes('error')) {
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

  protected getParamsForQuery(query: string) {
    if (!this.service) return [];
    if (
      !this.service.mobsosIDs ||
      Object.keys(this.service.mobsosIDs).length === 0
    ) {
      // just for robustness
      // should not be called when there are no service IDs stored in MobSOS anyway
      return [];
    }
    const serviceRegex = /\$SERVICE\$/g;
    const matches = query.match(serviceRegex);
    const params: string[] = [];
    if (matches) {
      // for now we use the id which has the greatest registrationTime as this is the agent ID of the most recent service agent started in las2peer
      const maxIndex = Object.values(this.service.mobsosIDs).reduce(
        (max, time, index) => {
          return time > max ? index : max;
        },
        0,
      );

      params.push(Object.keys(this.service.mobsosIDs)[maxIndex]);
    }
    return params;
  }

  protected applyVariableReplacements(query: string) {
    const ids = [];
    if (!this.service) {
      return query;
    }
    for (const mobsosID of Object.keys(this.service.mobsosIDs)) {
      ids.push(`"${mobsosID}"`);
    }
    let servicesString = '(';
    servicesString += ids.join(',') + ')';
    return query.replace('$SERVICES$', servicesString);
  }
}
