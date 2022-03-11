import { Query } from './query.model';
import { Visualization } from './visualization.model';

export class Measure {
  constructor(
    public name: string,
    public queries: Query[],
    public visualization: Visualization,
    public tags: string[],
    public description?: string,
  ) {}

  static fromXml(xml: Element): Measure {
    const measureName = xml.getAttribute('name');
    const queryNodes = Array.from(xml.getElementsByTagName('query'));
    let description = '';
    if (xml.getElementsByTagName('description')?.length > 0) {
      description = xml
        .getElementsByTagName('description')[0]
        .textContent.trim();
    }

    const queries: Query[] = [];
    for (const queryNode of queryNodes) {
      queries.push(Query.fromXml(queryNode));
    }
    const visualizationNode = Array.from(
      xml.getElementsByTagName('visualization'),
    )[0];
    const visualization = Visualization.fromXml(visualizationNode);
    const tagsCsv = xml.getAttribute('tags');
    let tags: string[] = [];
    if (tagsCsv) {
      tags = tagsCsv.split(';');
    }
    return new Measure(
      measureName,
      queries,
      visualization,
      tags,
      description,
    );
  }
  /**
   * Transforms a JSON representation of the measure into JavaScript object.
   * The  JSON object is missing the transformation function toXML() thus we transform it to later transform it into XML format
   *
   * @param obj JSON representation of the Measure
   * @returns JavaScript object representation
   */
  public static fromPlainObject(obj: Measure): Measure {
    if (!obj) return;
    const queries: Query[] = [];
    for (const objQuery of obj.queries) {
      queries.push(Query.fromPlainObject(objQuery));
    }
    const visualization = Visualization.fromPlainObject(
      obj.visualization,
    );
    const description = obj.description;
    return new Measure(
      obj.name,
      queries,
      visualization,
      obj.tags,
      description,
    );
  }

  /**
   * Transforms the javascript representation into xml representation
   *
   * @returns XML element
   */
  toXml(): Element {
    const doc = document.implementation.createDocument('', '', null);
    const measure = doc.createElement('measure');
    measure.setAttribute('name', this.name);
    if (this.tags) measure.setAttribute('tags', this.tags.join(';'));
    const description = doc.createElement('description');
    description.textContent = this.description;
    measure.appendChild(description);

    for (const query of this.queries) {
      measure.appendChild(query.toXml());
    }
    if (this.visualization) {
      measure.appendChild(this.visualization.toXml());
    }

    return measure;
  }
}

export interface MeasureMap {
  [key: string]: Measure;
}

export class MeasureCatalog {
  constructor(public measures: MeasureMap) {}

  static fromXml(xml: Element): MeasureCatalog {
    const measureNodes = Array.from(
      xml.getElementsByTagName('measure'),
    );
    const measureMap: MeasureMap = {};
    for (const measureNode of measureNodes) {
      const measureName = measureNode.getAttribute('name');
      measureMap[measureName] = Measure.fromXml(measureNode);
    }
    return new MeasureCatalog(measureMap);
  }

  public static fromPlainObject(obj: MeasureCatalog): MeasureCatalog {
    try {
      if (!obj?.measures) return;
      const measureMap: MeasureMap = {};
      for (const measureName of Object.keys(obj.measures)) {
        measureMap[measureName] = Measure.fromPlainObject(
          obj.measures[measureName],
        );
      }
      return new MeasureCatalog(measureMap);
    } catch (e) {
      e.printStackTrace();
      return;
    }
  }

  toXml(): Element {
    const doc = document.implementation.createDocument('', '', null);
    const catalog = doc.createElement('Catalog');
    for (const measure of Object.values(this.measures)) {
      if (typeof measure.toXml === 'undefined') {
        catalog.appendChild(Measure.fromPlainObject(measure).toXml());
      } else {
        catalog.appendChild(measure.toXml());
      }
    }
    return catalog;
  }
}
