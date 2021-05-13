import { Query } from './query.model';
import { Visualization } from './visualization.model';

export class Measure {
  constructor(
    public name: string,
    public queries: Query[],
    public visualization: Visualization,
    public tags: string[]
  ) {}

  static fromXml(xml: Element): Measure {
    const measureName = xml.getAttribute('name');
    const queryNodes = Array.from(xml.getElementsByTagName('query'));
    const queries = [];
    for (const queryNode of queryNodes) {
      queries.push(Query.fromXml(queryNode));
    }
    const visualizationNode = Array.from(
      xml.getElementsByTagName('visualization')
    )[0];
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

export interface MeasureMap {
  [key: string]: Measure;
}

export class MeasureCatalog {
  constructor(public measures: MeasureMap) {}

  static fromXml(xml: Element): MeasureCatalog {
    const measureNodes = Array.from(xml.getElementsByTagName('measure'));
    const measureMap: MeasureMap = {};
    for (const measureNode of measureNodes) {
      const measureName = measureNode.getAttribute('name');
      measureMap[measureName] = Measure.fromXml(measureNode);
    }
    return new MeasureCatalog(measureMap);
  }

  public static fromPlainObject(obj: MeasureCatalog): MeasureCatalog {
    const measureMap: MeasureMap = {};
    for (const measureName of Object.keys(obj.measures)) {
      measureMap[measureName] = Measure.fromPlainObject(
        obj.measures[measureName]
      );
    }
    return new MeasureCatalog(measureMap);
  }

  toXml(): Element {
    const doc = document.implementation.createDocument('', '', null);
    const catalog = doc.createElement('Catalog');
    for (const measure of Object.values(this.measures)) {
      catalog.appendChild(measure.toXml());
    }
    return catalog;
  }
}
