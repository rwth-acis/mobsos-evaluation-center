import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';

import { Observable, Subscription } from 'rxjs';
import { filter, map, switchMap, tap } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { ServiceInformation } from 'src/app/models/service.model';
import { fetchVisualizationData } from 'src/app/services/store.actions';
import { VISUALIZATION_DATA_FOR_QUERY } from 'src/app/services/store.selectors';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';

@Component({
  selector: 'app-sql-table',
  templateUrl: './sql-table.component.html',
  styleUrls: ['./sql-table.component.scss'],
})
export class SqlTableComponent
  implements OnInit, OnChanges, OnDestroy
{
  @Input() query: string;
  @Input() service: ServiceInformation;
  @Input() query$: Observable<string>;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator;

  queryParams: string[];
  vdata$: Observable<any[][]>;

  subscriptions$: Subscription[] = [];
  // eslint-disable-next-line @typescript-eslint/ban-types
  dataSource$: Observable<MatTableDataSource<{}>>;
  displayedColumns$: Observable<unknown>;
  constructor(private ngrxStore: Store) {}

  static htmlDecode(input) {
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
    if (this.query$) {
      this.vdata$ = this.query$.pipe(
        map((query) => {
          this.query = query;
          const qParams = this.getParamsForQuery(query);
          query = this.applyVariableReplacements(query);
          query =
            SqlTableComponent.applyCompatibilityFixForVisualizationService(
              query,
            );
          this.query = query;
          this.queryParams = qParams;
          return [query, qParams] as [string, string[]];
        }),
        tap(([query, queryParams]) =>
          this.ngrxStore.dispatch(
            fetchVisualizationData({ query, queryParams }),
          ),
        ),
        switchMap(([query]) =>
          this.ngrxStore
            .select(
              VISUALIZATION_DATA_FOR_QUERY({ queryString: query }),
            )
            .pipe(map((vdata) => vdata?.data)),
        ),
      );
    } else {
      let query = this.query;
      const queryParams = this.getParamsForQuery(query);
      query = this.applyVariableReplacements(query);
      query =
        SqlTableComponent.applyCompatibilityFixForVisualizationService(
          query,
        );
      this.query = query;
      this.queryParams = queryParams;
      this.ngrxStore.dispatch(
        fetchVisualizationData({ query, queryParams }),
      );
      this.vdata$ = this.ngrxStore
        .select(VISUALIZATION_DATA_FOR_QUERY({ queryString: query }))
        .pipe(map((vdata) => vdata?.data));
    }

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
      map((dataSource) => {
        dataSource.sort = this.sort;
        dataSource.paginator = this.paginator;
        return dataSource;
      }),
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (Object.keys(changes).includes('query') && this.query) {
    }
  }

  getDisplayedColumns(rawData: any[][]): string[] {
    if (!rawData) {
      return;
    }
    const displayedColumns = [...(rawData[0] as string[])]; // contains the labels
    for (let i = 0; i < rawData[1].length; i++) {
      displayedColumns[i] =
        displayedColumns[i] + ` (type: ${rawData[1][i] as string})`; // add type of the column
    }
    return displayedColumns;
  }

  getTableDataSource(rawData: any[][]) {
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

  protected getParamsForQuery(query: string) {
    if (!this.service) return [];
    if (this.service.mobsosIDs.length === 0) {
      // just for robustness
      // should not be called when there are no service IDs stored in MobSOS anyway
      return [];
    }
    const serviceRegex = /\$SERVICE\$/g;
    const matches = query.match(serviceRegex);
    const params: string[] = [];
    if (matches) {
      for (const match of matches) {
        // for now we just use the first ID
        // support for multiple IDs is not implemented yet
        params.push(this.service.mobsosIDs.slice(-1)[0].agentID);
      }
    }
    return params;
  }

  protected applyVariableReplacements(query: string) {
    const ids = [];
    if (!this.service) {
      return query;
    }
    for (const mobsosID of this.service?.mobsosIDs) {
      ids.push(`"${mobsosID.agentID}"`);
    }
    let servicesString = '(';
    servicesString += ids.join(',') + ')';
    return query.replace('$SERVICES$', servicesString);
  }
}
