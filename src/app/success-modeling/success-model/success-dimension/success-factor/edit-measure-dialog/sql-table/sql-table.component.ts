import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ServiceInformation } from 'src/app/models/service.model';
import { VisualizationData } from 'src/app/models/visualization.model';
import { fetchVisualizationData } from 'src/app/services/store.actions';
import { VISUALIZATION_DATA_FOR_QUERY } from 'src/app/services/store.selectors';

@Component({
  selector: 'app-sql-table',
  templateUrl: './sql-table.component.html',
  styleUrls: ['./sql-table.component.scss'],
})
export class SqlTableComponent implements OnInit, OnChanges {
  @Input() query: string;
  @Input() service: ServiceInformation;

  queryParams: string[];
  vdata$: Observable<any[][]>;

  constructor(private ngrxStore: Store) {}

  static htmlDecode(input) {
    const doc = new DOMParser().parseFromString(input, 'text/html');
    return doc.documentElement.textContent;
  }

  protected static applyCompatibilityFixForVisualizationService(
    query: string,
  ) {
    // note that the replace value is actually $$SERVICE$$, but each $ must be escaped with another $
    query = query.replace(/\$SERVICE\$/g, '$$$$SERVICE$$$$');
    query = SqlTableComponent.htmlDecode(query);
    return query;
  }

  ngOnInit() {
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

  ngOnChanges(changes: SimpleChanges): void {
    if (Object.keys(changes).includes('query') && this.query) {
    }
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
        params.push(this.service.mobsosIDs.slice(-1)[0].agentID);
      }
    }
    return params;
  }

  protected applyVariableReplacements(query: string) {
    const ids = [];
    for (const mobsosID of this.service?.mobsosIDs) {
      ids.push(`"${mobsosID.agentID}"`);
    }
    let servicesString = '(';
    servicesString += ids.join(',') + ')';
    return query.replace('$SERVICES$', servicesString);
  }
}
