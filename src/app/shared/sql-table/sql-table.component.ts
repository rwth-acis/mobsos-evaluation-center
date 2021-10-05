import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { ServiceInformation } from 'src/app/models/service.model';

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
  results: any[][];
  queryParams: string[];

  subscriptions$: Subscription[] = [];
  constructor() {}

  static htmlDecode(input) {
    const doc = new DOMParser().parseFromString(input, 'text/html');
    return doc.documentElement.textContent;
  }

  protected static applyCompatibilityFixForVisualizationService(
    query: string,
  ) {
    if (!query) return null;
    // note that the replace value is actually $$SERVICE$$, but each $ must be escaped with another $
    query = query?.replace(/\$SERVICE\$/g, '$$$$SERVICE$$$$');
    query = SqlTableComponent.htmlDecode(query);
    return query;
  }

  ngOnInit() {
    const sub = this.query$?.subscribe((q) => {
      this.query = q;
      const qParams = this.getParamsForQuery(q);
      q = this.applyVariableReplacements(q);
      q =
        SqlTableComponent.applyCompatibilityFixForVisualizationService(
          q,
        );
      this.query = q;
      this.queryParams = qParams;
      console.log(this.query);
    });
    this.subscriptions$.push(sub);
    console.error(this.query);
    let query = this.query;
    const queryParams = this.getParamsForQuery(query);
    query = this.applyVariableReplacements(query);
    query =
      SqlTableComponent.applyCompatibilityFixForVisualizationService(
        query,
      );
    this.query = query;
    this.queryParams = queryParams;
  }

  ngOnDestroy() {
    this.subscriptions$.forEach((sub) => sub.unsubscribe());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (Object.keys(changes).includes('query') && this.query) {
    }
  }

  protected getParamsForQuery(query: string) {
    if (!this.service) return null;
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
    if (!this.service) return query;
    let servicesString = '(';
    const services = [];
    for (const mobsosID of this.service?.mobsosIDs) {
      services.push(`"${mobsosID.agentID}"`);
    }
    servicesString += services.join(',') + ')';
    return query.replace('$SERVICES$', servicesString);
  }
}
