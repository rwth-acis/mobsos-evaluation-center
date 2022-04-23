/* eslint-disable @typescript-eslint/unbound-method */
import { HttpErrorResponse } from '@angular/common/http';
import { MathExpression } from 'mathjs';

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

  constructor(public expression?: MathExpression) {
    super();
  }

  public static fromPlainObject(obj: any): KpiVisualization {
    if (obj?.operationsElements) {
      const expression: MathExpression =
        obj.operationsElements.reduce(
          (exp, op) => exp + op.name.toString() + ' ',
          '',
        );
    } else return new KpiVisualization(obj.expression);
  }

  static fromXml(xml: Element): KpiVisualization {
    const expressions = Array.from(
      xml.getElementsByTagName('expression'),
    );
    if (expressions.length > 0) {
      const e =
        expressions.length === 0 ? null : expressions[0].innerHTML;
      return new KpiVisualization(e);
    } else {
      // legacy transformation
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
      const expression: MathExpression = elements.reduce(
        (exp, op) => exp + op.name.toString() + ' ',
        '',
      );
      return new KpiVisualization(expression);
    }
  }

  protected _toXml(visualizationNode: Element) {
    const doc = document.implementation.createDocument('', '', null);
    const unit = doc.createElement('expression');
    unit.innerHTML = this.expression.toString();
    visualizationNode.appendChild(unit);
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
