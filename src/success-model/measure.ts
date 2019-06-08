import {Query} from './query';
import {Visualization} from './visualization';

export class Measure {

  constructor(public name: string, public queries: Query[], public visualization: Visualization) {
  }

  static fromXml(xml: Element): Measure {
    const measureName = xml.getAttribute('name');
    const queryNodes = Array.from(xml.getElementsByTagName('query'));
    const queries = [];
    for (const queryNode of queryNodes) {
      queries.push(Query.fromXml(queryNode));
    }
    const visualizationNode = Array.from(xml.getElementsByTagName('visualization'))[0];
    const visualization = Visualization.fromXml(visualizationNode);
    return new Measure(measureName, queries, visualization);
  }

  toXml() {

  }
}
