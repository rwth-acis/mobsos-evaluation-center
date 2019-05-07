import {SuccessFactor} from "./success-factor";

export interface DimensionMap {
  'System Quality': SuccessFactor;
  'Information Quality': SuccessFactor;
  'Use': SuccessFactor;
  'User Satisfaction': SuccessFactor;
  'Individual Impact': SuccessFactor;
  'Community Impact': SuccessFactor,
}

const initialDimensionMap: DimensionMap = {
  'System Quality': null,
  'Information Quality': null,
  'Use': null,
  'User Satisfaction': null,
  'Individual Impact': null,
  'Community Impact': null,
};

export class SuccessModel {

  constructor(public name: string, public service: string, public dimensions: DimensionMap) {
  }

  static fromXml(xml: Element) {
    try {
      const modelName = xml.getAttribute('name');
      const service = xml.getAttribute('service');
      const dimensionNodes = Array.from(xml.getElementsByTagName('dimension'));
      const dimensions: DimensionMap = Object.assign({}, initialDimensionMap);
      for (let dimensionNode of dimensionNodes) {
        const dimensionName = dimensionNode.getAttribute('name');
        const availableDimensions = Object.keys(dimensions);
        if (!availableDimensions.includes(dimensionName)) {
          throw new Error(`${dimensionName} is not a valid dimension. Valid dimensions are 
        ${availableDimensions.join()}`);
        }
        dimensions[dimensionName] = SuccessFactor.fromXml(dimensionNode)
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
