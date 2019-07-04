export class SuccessFactor {

  constructor(public name: string, public measures: string[]) {
  }

  static fromXml(xml: Element) {
    try {
      const factorName = xml.getAttribute('name');
      const measureNodes = Array.from(xml.getElementsByTagName('measure'));
      const measures = [];
      for (const measureNode of measureNodes) {
        measures.push(measureNode.getAttribute('name'));
      }
      return new SuccessFactor(factorName, measures);
    } catch (e) {
      throw new Error('Parsing factor failed:' + e);
    }
  }

  public static fromPlainObject(obj: SuccessFactor): SuccessFactor {
    return new SuccessFactor(obj.name, obj.measures);
  }

  toXml(): Element {
    const doc = document.implementation.createDocument('', '', null);
    const factor = doc.createElement('factor');
    factor.setAttribute('name', this.name);
    for (const measureName of this.measures) {
      const measure = doc.createElement('measure');
      measure.setAttribute('name', measureName);
      factor.appendChild(measure);
    }
    return factor;
  }
}
