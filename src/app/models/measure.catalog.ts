import { Measure } from './measure.model';

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
