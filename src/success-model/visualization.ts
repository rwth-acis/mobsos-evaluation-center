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
  type = 'Chart';

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

  operators = {
    '/': KpiVisualization.divide,
    '*': KpiVisualization.multiply,
    '+': KpiVisualization.add,
    '-': KpiVisualization.subtract,
  };

  constructor(public operationsElements: KpiVisualizationOperand[] | KpiVisualizationOperator[]) {
    super();
  }

  static divide(left, right) {
    return left / right;
  }

  static multiply(left, right) {
    return left * right;
  }

  static add(left, right) {
    return left + right;
  }

  static subtract(left, right) {
    return left - right;
  }

  static fromXml(xml: Element): KpiVisualization {
    const operandNodes = Array.from(xml.getElementsByTagName('operand'));
    const operatorNodes = Array.from(xml.getElementsByTagName('operator'));
    const elements = [];
    for (const operandNode of operandNodes) {
      elements.push(KpiVisualizationOperand.fromXml(operandNode));
    }
    for (const operatorNode of operatorNodes) {
      elements.push(KpiVisualizationOperator.fromXml(operatorNode));
    }
    elements.sort((a, b) => a.index > b.index ? 1 : -1);
    return new KpiVisualization(elements);
  }

  toXml() {

  }

  /**
   * Each term element is either a number or an operand like "/".
   *
   * @param term An array of symbols and operators like ["5", "+", "3"].
   */
  public evaluateTerm(term: string[]) {
    const operatorSigns = Object.keys(this.operators);
    // find first operator
    let result;
    term.forEach((termPart, index) => {
      if (operatorSigns.includes(termPart)) {
        const operatorFunc: CallableFunction = this.operators[termPart];
        const leftHandSide = this.evaluateTerm(term.slice(0, index - 1));
        const rightHandSide = this.evaluateTerm(term.slice(index + 1, -1));
        result = operatorFunc(leftHandSide, rightHandSide);
      }
    });
    if (!result) {
      result = parseFloat(term[0]);
    }
    return result;
  }
}

export class KpiVisualizationOperand {

  constructor(public name: string, public index: number) {
  }

  static fromXml(xml: Element): KpiVisualizationOperand {
    const name = xml.getAttribute('name');
    const index = parseInt(xml.getAttribute('index'), 10);
    return new KpiVisualizationOperand(name, index);
  }

  toXml() {

  }
}

export class KpiVisualizationOperator {

  constructor(public name: string, public index: number) {
  }

  static fromXml(xml: Element): KpiVisualizationOperator {
    const name = xml.getAttribute('name');
    const index = parseInt(xml.getAttribute('index'), 10);
    return new KpiVisualizationOperator(name, index);
  }

  toXml() {

  }
}
