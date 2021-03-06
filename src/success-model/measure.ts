import {Query} from './query';
import {Visualization} from './visualization';

export class Measure {

  constructor(public name: string, public queries: Query[], public visualization: Visualization, public tags: string[]) {
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
    const tagsCsv = xml.getAttribute('tags');
    let tags = [];
    if (tagsCsv) {
      tags = tagsCsv.split(';');
    }
    return new Measure(measureName, queries, visualization, tags);
  }

  public static fromPlainObject(obj: Measure): Measure {
    const queries: Query[] = [];
    for (const objQuery of obj.queries) {
      queries.push(Query.fromPlainObject(objQuery));
    }
    const visualization = Visualization.fromPlainObject(obj.visualization);
    return new Measure(obj.name, queries, visualization, obj.tags);
  }

  toXml(): Element {
    const doc = document.implementation.createDocument('', '', null);
    const measure = doc.createElement('measure');
    measure.setAttribute('name', this.name);
    measure.setAttribute('tags', this.tags.join(';'));
    for (const query of this.queries) {
      measure.appendChild(query.toXml());
    }
    measure.appendChild(this.visualization.toXml());
    return measure;
  }
}
