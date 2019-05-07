import {Measure} from "./measure";

export interface MeasureMap {
  [key: string]: Measure
}

export class MeasureCatalog {

  constructor(public measures: MeasureMap) {
  }

  static fromXml(xml: Element): MeasureCatalog {
    const measureNodes = Array.from(xml.getElementsByTagName('measure'));
    const measureMap: MeasureMap = {};
    for (let measureNode of measureNodes) {
      const measureName = measureNode.getAttribute('name');
      measureMap[measureName] = Measure.fromXml(measureNode);
    }
    return new MeasureCatalog(measureMap);
  }

  toXml() {

  }
}
