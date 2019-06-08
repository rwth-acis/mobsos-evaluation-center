import {
  Component,
  ComponentFactoryResolver,
  ComponentRef,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import {Measure} from '../../success-model/measure';
import {ServiceInformation} from '../store.service';
import {ChartVisualization, KpiVisualization, ValueVisualization} from '../../success-model/visualization';
import {Las2peerService} from '../las2peer.service';
import {DomSanitizer} from '@angular/platform-browser';
import {MatDialog} from '@angular/material';
import {VisualizationDirective} from '../visualization.directive';
import {ValueVisualizationComponent} from '../visualizations/value-visualization/value-visualization.component';
import {VisualizationComponent} from '../visualizations/visualization.component';
import {KpiVisualizationComponent} from '../visualizations/kpi-visualization/kpi-visualization.component';
import {ChartVisualizationComponent} from '../visualizations/chart-visualization/chart-visualization.component';

@Component({
  selector: 'app-success-measure',
  templateUrl: './success-measure.component.html',
  styleUrls: ['./success-measure.component.scss']
})
export class SuccessMeasureComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild(VisualizationDirective) visualizationHost: VisualizationDirective;
  @Input() measure: Measure;
  @Input() service: ServiceInformation;
  public visualizationError: string;
  public error: Response;
  componentRef: ComponentRef<{}>;

  constructor(private las2peer: Las2peerService, private sanitizer: DomSanitizer, private dialog: MatDialog,
              private componentFactoryResolver: ComponentFactoryResolver) {
  }

  static htmlDecode(input) {
    const doc = new DOMParser().parseFromString(input, 'text/html');
    return doc.documentElement.textContent;
  }

  ngOnInit() {
    this.refreshVisualization();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.relayPropertiesToVisualizationComponent();
  }

  ngOnDestroy(): void {
  }

  refreshVisualization() {
    if (this.measure) {
      let componentFactory;
      if (this.measure.visualization instanceof ValueVisualization) {
        componentFactory = this.componentFactoryResolver.resolveComponentFactory(ValueVisualizationComponent);
      } else if (this.measure.visualization instanceof ChartVisualization) {
        componentFactory = this.componentFactoryResolver.resolveComponentFactory(ChartVisualizationComponent);
      } else if (this.measure.visualization instanceof KpiVisualization) {
        componentFactory = this.componentFactoryResolver.resolveComponentFactory(KpiVisualizationComponent);
      } else {
        this.visualizationError = `The visualization type ${this.measure.visualization.type} is not supported yet.`;
        return;
      }
      const viewContainerRef = this.visualizationHost.viewContainerRef;
      viewContainerRef.clear();
      this.componentRef = viewContainerRef.createComponent(componentFactory);
      this.relayPropertiesToVisualizationComponent();
      this.visualizationError = null;
    }
  }

  private relayPropertiesToVisualizationComponent() {
    if (this.componentRef) {
      (this.componentRef.instance as VisualizationComponent).service = this.service;
      (this.componentRef.instance as VisualizationComponent).measure = this.measure;
    }
  }

  private async visualizeChart(queries, chartType) {
    let format: string;
    switch (chartType) {
      case 'LineChart':
        format = 'GOOGLELINECHART';
        break;
      case 'PieChart':
        format = 'GOOGLEPIECHART';
        break;
      case 'BarChart':
        format = 'GOOGLEBARCHART';
        break;
      case 'RadarChart':
        format = 'GOOGLERADARCHART';
        break;
      case 'TimelineChart':
        format = 'GOOGLETIMELINECHART';
        break;
      default:
        return `Chart type ${chartType} is not supported yet.`;
    }
    let query = queries[0].sql;
    const queryParams = this.getParamsForQuery(query);
    query = this.applyCompatibilityFixForVisualizationService(query);
    const data = await this.fetchVisualization(query, queryParams, format);
    return data;
  }

  private fetchVisualization(query, queryParams, format: string) {
    return this.las2peer.visualizeQuery(query, queryParams, format).then(data => {
      this.error = null;
      return data;
    }).catch(error => this.error = error);
  }


  private getParamsForQuery(query: string) {
    if (this.service.mobsosIDs.length === 0) {
      // just for robustness
      // should not be called when there are no service IDs stored in MobSOS anyway
      return [];
    }
    const serviceRegex = /\$SERVICE\$/g;
    const matches = query.match(serviceRegex);
    const params = [];
    for (const match of matches) {
      // for now we just use the first ID
      // support for multiple IDs is not implemented yet
      params.push(this.service.mobsosIDs[0]);
    }
    return params;
  }

  private applyCompatibilityFixForVisualizationService(query: string) {
    // note that the replace value is actually $$SERVICE$$, but each $ must be escaped with another $
    query = query.replace(/\$SERVICE\$/g, '$$$$SERVICE$$$$');
    query = SuccessMeasureComponent.htmlDecode(query);
    return query;
  }


}
