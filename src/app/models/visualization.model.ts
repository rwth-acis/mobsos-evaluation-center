export interface VisualizationCollection {
  [key: string]: Visualization;
}

export class Visualization {
  type: string;

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

  public static fromPlainObject(obj: Visualization): Visualization {
    const visualizationType = obj.type;
    switch (visualizationType) {
      case 'KPI':
        return KpiVisualization.fromPlainObject(obj as KpiVisualization);
      case 'Chart':
        return ChartVisualization.fromPlainObject(obj as ChartVisualization);
      case 'Value':
        return ValueVisualization.fromPlainObject(obj as ValueVisualization);
      default:
        throw Error('Unknown visualization type: ' + visualizationType);
    }
  }

  toXml(): Element {
    const doc = document.implementation.createDocument('', '', null);
    const visualization = doc.createElement('visualization');
    visualization.setAttribute('type', this.type);
    this._toXml(visualization);
    return visualization;
  }

  protected _toXml(visualizationNode: Element) {
    throw new Error('Override in subclass');
  }
}

export class ValueVisualization extends Visualization {
  type = 'Value';

  constructor(public unit: string) {
    super();
  }

  public static fromPlainObject(obj: ValueVisualization): ValueVisualization {
    return new ValueVisualization(obj.unit);
  }

  static fromXml(xml: Element): ValueVisualization {
    const unitArr = Array.from(xml.getElementsByTagName('unit'));
    const unit = unitArr.length === 0 ? null : unitArr[0].innerHTML;
    return new ValueVisualization(unit);
  }

  protected _toXml(visualizationNode: Element) {
    const doc = document.implementation.createDocument('', '', null);
    const unit = doc.createElement('unit');
    unit.innerHTML = this.unit;
    visualizationNode.appendChild(unit);
  }
}

export class ChartVisualization extends Visualization {
  type = 'Chart';

  constructor(
    public chartType: string,
    public nodeId: string,
    public title: string,
    public height: string,
    public width: string
  ) {
    super();
  }

  public static fromPlainObject(obj: ChartVisualization): ChartVisualization {
    return new ChartVisualization(
      obj.chartType,
      obj.nodeId,
      obj.title,
      obj.height,
      obj.width
    );
  }

  static fromXml(xml: Element): ChartVisualization {
    const chartType = Array.from(xml.getElementsByTagName('chartType'))[0]
      .innerHTML;
    const nodeId = Array.from(xml.getElementsByTagName('nodeId'))[0].innerHTML;
    const title = Array.from(xml.getElementsByTagName('title'))[0].innerHTML;
    const height = Array.from(xml.getElementsByTagName('height'))[0].innerHTML;
    const width = Array.from(xml.getElementsByTagName('width'))[0].innerHTML;
    return new ChartVisualization(chartType, nodeId, title, height, width);
  }

  protected _toXml(visualizationNode: Element) {
    const doc = document.implementation.createDocument('', '', null);
    const chartType = doc.createElement('chartType');
    chartType.innerHTML = this.chartType;
    const nodeId = doc.createElement('nodeId');
    nodeId.innerHTML = this.nodeId;
    const title = doc.createElement('title');
    title.innerHTML = this.title;
    const height = doc.createElement('height');
    height.innerHTML = this.height;
    const width = doc.createElement('width');
    width.innerHTML = this.width;

    visualizationNode.appendChild(chartType);
    visualizationNode.appendChild(nodeId);
    visualizationNode.appendChild(title);
    visualizationNode.appendChild(height);
    visualizationNode.appendChild(width);
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

  constructor(
    public operationsElements:
      | KpiVisualizationOperand[]
      | KpiVisualizationOperator[]
  ) {
    super();
  }

  public static fromPlainObject(obj: KpiVisualization): KpiVisualization {
    const operationsElements:
      | KpiVisualizationOperand[]
      | KpiVisualizationOperator[] = [];
    obj.operationsElements.forEach((value, index) => {
      if (index % 2 === 0) {
        operationsElements.push(
          new KpiVisualizationOperand(value.name, value.index)
        );
      } else {
        operationsElements.push(
          new KpiVisualizationOperator(value.name, value.index)
        );
      }
    });
    return new KpiVisualization(operationsElements);
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
    elements.sort((a, b) => (a.index > b.index ? 1 : -1));
    return new KpiVisualization(elements);
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
        const leftHandSide = this.evaluateTerm(term.slice(0, index));
        const rightHandSide = this.evaluateTerm(term.slice(index + 1));
        result = operatorFunc(leftHandSide, rightHandSide);
      }
    });
    if (!result) {
      result = parseFloat(term[0]);
    }
    return result;
  }

  protected _toXml(visualizationNode: Element) {
    for (const operationElement of this.operationsElements) {
      visualizationNode.appendChild(operationElement.toXml());
    }
  }
}

export class KpiVisualizationOperand {
  constructor(public name: string, public index: number) {}

  static fromXml(xml: Element): KpiVisualizationOperand {
    const name = xml.getAttribute('name');
    const index = parseInt(xml.getAttribute('index'), 10);
    return new KpiVisualizationOperand(name, index);
  }

  toXml(): Element {
    const doc = document.implementation.createDocument('', '', null);
    const operand = doc.createElement('operand');
    operand.setAttribute('name', this.name);
    operand.setAttribute('index', String(this.index));
    return operand;
  }
}

export class KpiVisualizationOperator {
  constructor(public name: string, public index: number) {}

  static fromXml(xml: Element): KpiVisualizationOperator {
    const name = xml.getAttribute('name');
    const index = parseInt(xml.getAttribute('index'), 10);
    return new KpiVisualizationOperator(name, index);
  }

  toXml(): Element {
    const doc = document.implementation.createDocument('', '', null);
    const operator = doc.createElement('operator');
    operator.setAttribute('name', this.name);
    operator.setAttribute('index', String(this.index));
    return operator;
  }
}

export enum VisualizationType {
  VALUE = 'Value',
  KPI = 'KPI',
  CHART = 'Chart',
}
