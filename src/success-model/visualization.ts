import {KpiVisualization} from "./kpi-visualization";
import {ChartVisualization} from "./chart-visualization";
import {ValueVisualization} from "./value-visualization";

export class Visualization {
  type;

  static fromXml(xml: Element): Visualization {
    const visualizationType = xml.getAttribute('type');
    switch (visualizationType) {
      case 'KPI':
        return KpiVisualization.fromXml(xml);
      case 'Chart':
        return ChartVisualization.fromXml(xml);
      case 'Value':
        return ValueVisualization.fromXml(xml);
      default:
        throw Error('Unknown visualization type: ' + visualizationType);
    }
  }

  toXml() {

  }
}
