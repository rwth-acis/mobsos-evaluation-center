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


export class ValueVisualization extends Visualization {
  type = 'Value';

  static fromXml(xml: Element): ValueVisualization {
    return new ValueVisualization();
  }

  toXml() {

  }
}

export class ChartVisualization extends Visualization {

  constructor(public chartType: string, public nodeId: string, public title: string, public height: string,
              public width: string) {
    super();
  }

  static fromXml(xml: Element): ChartVisualization {
    const chartType = Array.from(xml.getElementsByTagName('chartType'))[0].innerHTML;
    const nodeId = Array.from(xml.getElementsByTagName('nodeId'))[0].innerHTML;
    const title = Array.from(xml.getElementsByTagName('title'))[0].innerHTML;
    const height = Array.from(xml.getElementsByTagName('height'))[0].innerHTML;
    const width = Array.from(xml.getElementsByTagName('width'))[0].innerHTML;
    return new ChartVisualization(chartType, nodeId, title, height, width);
  }

  toXml() {

  }
}

export class KpiVisualization extends Visualization {
  type = 'KPI';

  constructor(public operationsElements: KpiVisualizationOperand[] | KpiVisualizationOperator[]) {
    super();
  }

  static fromXml(xml: Element): KpiVisualization {
    const operandNodes = Array.from(xml.getElementsByTagName('operand'));
    const operatorNodes = Array.from(xml.getElementsByTagName('operator'));
    const elements = [];
    for (let operandNode of operandNodes) {
      elements.push(KpiVisualizationOperator.fromXml(operandNode));
    }
    for (let operatorNode of operatorNodes) {
      elements.push(KpiVisualizationOperand.fromXml(operatorNode));
    }
    elements.sort((a, b) => a.index > b.index ? 1 : -1);
    return new KpiVisualization(elements);
  }

  toXml() {

  }
}

class KpiVisualizationOperand {

  constructor(public name: string, public index: Number) { }

  static fromXml(xml: Element): KpiVisualizationOperand {
    const name = xml.getAttribute('name');
    const index = parseInt(xml.getAttribute('index'));
    return new KpiVisualizationOperand(name, index);
  }

  toXml() {

  }
}

class KpiVisualizationOperator {

  constructor(public name: string, public index: Number) {}

  static fromXml(xml: Element): KpiVisualizationOperator {
    const name = xml.getAttribute('name');
    const index = parseInt(xml.getAttribute('index'));
    return new KpiVisualizationOperator(name, index);
  }

  toXml() {

  }
}
