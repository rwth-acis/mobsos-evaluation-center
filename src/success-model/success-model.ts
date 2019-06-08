import {SuccessFactor} from './success-factor';
import {merge} from 'lodash-es';

export interface DimensionMap {
  'System Quality': SuccessFactor[];
  'Information Quality': SuccessFactor[];
  'Use': SuccessFactor[];
  'User Satisfaction': SuccessFactor[];
  'Individual Impact': SuccessFactor[];
  'Community Impact': SuccessFactor[];
}

const initialDimensionMap: DimensionMap = {
  'System Quality': [],
  'Information Quality': [],
  Use: [],
  'User Satisfaction': [],
  'Individual Impact': [],
  'Community Impact': [],
};

export class SuccessModel {

  constructor(public name: string, public service: string, public dimensions: DimensionMap) {
  }

  static fromXml(xml: Element) {
    try {
      const modelName = xml.getAttribute('name');
      const service = xml.getAttribute('service');
      const dimensionNodes = Array.from(xml.getElementsByTagName('dimension'));
      const dimensions: DimensionMap = merge({}, initialDimensionMap);
      for (const dimensionNode of dimensionNodes) {
        const dimensionName = dimensionNode.getAttribute('name');
        const availableDimensions = Object.keys(dimensions);
        if (!availableDimensions.includes(dimensionName)) {
          throw new Error(`${dimensionName} is not a valid dimension. Valid dimensions are ${availableDimensions.join()}`);
        }
        const factorNodes = Array.from(dimensionNode.getElementsByTagName('factor'));
        for (const factorNode of factorNodes) {
          dimensions[dimensionName].push(SuccessFactor.fromXml(factorNode));
        }
      }
      return new SuccessModel(modelName, service, dimensions);
    } catch (e) {
      throw new Error('Parsing model failed: ' + e);
    }
  }

  toXml(): Document {
    return null;
  }
}
