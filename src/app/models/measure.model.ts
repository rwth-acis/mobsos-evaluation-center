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

    const queries = [];
    for (const queryNode of queryNodes) {
      queries.push(Query.fromXml(queryNode));
    }
    const visualizationNode = Array.from(
      xml.getElementsByTagName('visualization'),
    )[0];
    const visualization = Visualization.fromXml(visualizationNode);
    const tagsCsv = xml.getAttribute('tags');
    let tags = [];
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

  toXml(): Element {
    const doc = document.implementation.createDocument('', '', null);
    const measure = doc.createElement('measure');
    measure.setAttribute('name', this.name);
    measure.setAttribute('tags', this.tags.join(';'));
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
