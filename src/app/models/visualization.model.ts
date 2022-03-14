/* eslint-disable @typescript-eslint/unbound-method */
import { HttpErrorResponse } from '@angular/common/http';

export interface VisualizationCollection {
  [query: string]: VisualizationData; // Map of query names to visualization data
}
export interface VisualizationData {
  fetchDate: string; // Date when the data was fetched
  data: any[][]; // Data for the visualization
  error?: HttpErrorResponse; // Error if any
  loading?: boolean; // Is the data currently being fetched from the server?
}

export class Visualization {
  type: SupportedVisualizationTypes;

  static fromXml(xml: Element): Visualization {
    if (!xml) return;
    const visualizationType = xml.getAttribute('type');
    switch (visualizationType) {
      case 'KPI':
        return KpiVisualization.fromXml(xml);
      case 'Chart':
        return ChartVisualization.fromXml(xml);
      case 'Value':
        return ValueVisualization.fromXml(xml);
      default:
        throw Error(
          'Unknown visualization type: ' + visualizationType,
        );
    }
  }

  public static fromPlainObject(obj: Visualization): Visualization {
    if (!obj) return;
    const visualizationType = obj.type;
    switch (visualizationType) {
      case 'KPI':
        return KpiVisualization.fromPlainObject(
          obj as KpiVisualization,
        );
      case 'Chart':
        return ChartVisualization.fromPlainObject(
          obj as ChartVisualization,
        );
      case 'Value':
        return ValueVisualization.fromPlainObject(
          obj as ValueVisualization,
        );
      default:
        throw Error(
          'Unsupported visualization type: ' +
            (visualizationType as string),
        );
    }
  }

  toXml(): Element {
    const doc = document.implementation.createDocument('', '', null);
    const visualization = doc.createElement('visualization');
    visualization.setAttribute('type', this.type);
    this._toXml(visualization);
    return visualization;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected _toXml(visualizationNode: Element) {
    throw new Error('Override in subclass');
  }
}

export class ValueVisualization extends Visualization {
  type = 'Value' as SupportedVisualizationTypes;

  constructor(public unit?: string) {
    super();
  }

  public static fromPlainObject(
    obj: ValueVisualization,
  ): ValueVisualization {
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
  type = 'Chart' as SupportedVisualizationTypes;

  constructor(
    public chartType?: string,
    public nodeId?: string,
    public title?: string,
    public height?: string,
    public width?: string,
  ) {
    super();
  }

  public static fromPlainObject(
    obj: ChartVisualization,
  ): ChartVisualization {
    return new ChartVisualization(
      obj.chartType,
      obj.nodeId,
      obj.title,
      obj.height,
      obj.width,
    );
  }

  static fromXml(xml: Element): ChartVisualization {
    const chartType = Array.from(
      xml.getElementsByTagName('chartType'),
    )[0].innerHTML;
    const nodeId = Array.from(xml.getElementsByTagName('nodeId'))[0]
      .innerHTML;
    const title = Array.from(xml.getElementsByTagName('title'))[0]
      .innerHTML;
    const height = Array.from(xml.getElementsByTagName('height'))[0]
      .innerHTML;
    const width = Array.from(xml.getElementsByTagName('width'))[0]
      .innerHTML;
    return new ChartVisualization(
      chartType,
      nodeId,
      title,
      height,
      width,
    );
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
  type = 'KPI' as SupportedVisualizationTypes;

  operators = {
    '/': KpiVisualization.divide,
    '*': KpiVisualization.multiply,
    '+': KpiVisualization.add,
    '-': KpiVisualization.subtract,
  };

  constructor(
    public operationsElements?:
      | KpiVisualizationOperand[]
      | KpiVisualizationOperator[],
  ) {
    super();
  }

  public static fromPlainObject(
    obj: KpiVisualization,
  ): KpiVisualization {
    const operationsElements:
      | KpiVisualizationOperand[]
      | KpiVisualizationOperator[] = [];
    if (!obj.operationsElements) return;
    obj.operationsElements.forEach((value, index) => {
      if (index % 2 === 0) {
        operationsElements.push(
          new KpiVisualizationOperand(value.name, value.index),
        );
      } else {
        operationsElements.push(
          new KpiVisualizationOperator(value.name, value.index),
        );
      }
    });
    return new KpiVisualization(operationsElements);
  }

  static divide(left: number, right: number): number {
    return left / right;
  }

  static multiply(left: number, right: number): number {
    return left * right;
  }

  static add(left: number, right: number) {
    if (typeof left === 'number' && typeof right === 'number') {
      return left + right;
    } else {
      console.error(
        `Cannot add ${left} and ${right} their type does not allow it`,
      );
      return;
    }
  }

  static subtract(left: number, right: number): number {
    return left - right;
  }

  static fromXml(xml: Element): KpiVisualization {
    const operandNodes = Array.from(
      xml.getElementsByTagName('operand'),
    );
    const operatorNodes = Array.from(
      xml.getElementsByTagName('operator'),
    );
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
  public evaluateTerm(term: string[]): number {
    const operatorSigns = Object.keys(this.operators);
    // find first operator
    let result;
    for (let index = 0; index < term.length; index++) {
      const termPart = term[index];
      if (operatorSigns.includes(termPart)) {
        const operatorFunc: CallableFunction =
          this.operators[termPart];
        const leftHandSide = this.evaluateTerm(term.slice(0, index));
        const rightHandSide = this.evaluateTerm(
          term.slice(index + 1),
        );
        result = operatorFunc(leftHandSide, rightHandSide) as number;
      }
    }

    if (!result) {
      result = parseFloat(term[0]);
    }
    return result as number;
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

type SupportedVisualizationTypes = 'Value' | 'KPI' | 'Chart';
