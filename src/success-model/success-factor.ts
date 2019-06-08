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

  toXml() {

  }
}
