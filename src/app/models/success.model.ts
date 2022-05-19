import { ReqbazProject } from './reqbaz.model';
import { ServiceInformation } from './service.model';
import { Survey } from './survey.model';

export interface DimensionMap {
  'System Quality': SuccessFactor[];
  'Information Quality': SuccessFactor[];
  Use: SuccessFactor[];
  'User Satisfaction': SuccessFactor[];
  'Individual Impact': SuccessFactor[];
  'Community Impact': SuccessFactor[];
}

class InitialDimensionMap implements DimensionMap {
  'System Quality': SuccessFactor[];
  'Information Quality': SuccessFactor[];
  Use: SuccessFactor[];
  'User Satisfaction': SuccessFactor[];
  'Individual Impact': SuccessFactor[];
  'Community Impact': SuccessFactor[];
  constructor() {
    this['System Quality'] = [];
    this['Information Quality'] = [];
    this.Use = [];
    this['User Satisfaction'] = [];
    this['Individual Impact'] = [];
    this['Community Impact'] = [];
  }
}

export interface SuccessModel {
  name: string; // Name of the success model (usually the service alias)
  service: string; // Name of the service	which the model is made for
  dimensions: DimensionMap; // The dimensions of the success model
}

export interface SuccessFactor {
  name: string; // Name of the success factor
  measures: string[]; // Names of the measures of the success factor.
}

export class SuccessModel implements SuccessModel {
  constructor(
    public name: string,
    public service: string,
    public dimensions: DimensionMap,
    public surveys: Survey[],
    public reqBazProject: ReqbazProject,
  ) {}

  /**
   * Initializes a new instance of a success model which is empty.
   *
   * @param service service for which an empty success model should be created
   * @returns an empty model (success model with each dimension being [])
   * @throws Error if the service is undefined
   */
  public static emptySuccessModel(service: ServiceInformation) {
    try {
      if (!service) {
        console.warn('Service can\'t be undefined');
        return;
      }
      return new SuccessModel(
        service.alias,
        service.name,
        new InitialDimensionMap(),
        [],
        null,
      );
    } catch (error) {
      throw new Error(
        'Cannot create emptySuccessModel. Reason: ' +
          (error.message as string),
      );
    }
  }

  /**
   * Creates a Success model from a plain json object
   *
   * @param obj plain json object representation of a success model
   * @returns a SuccessModel object with the same properties as the plain json object
   */
  public static fromPlainObject(
    obj: PlainSuccessModel,
  ): SuccessModel {
    if (!obj?.dimensions) {
      return undefined;
    }
    const dimensions: DimensionMap = new InitialDimensionMap();
    for (const objDimensionName of Object.keys(obj.dimensions)) {
      dimensions[objDimensionName] = [];
      for (const objFactor of obj.dimensions[objDimensionName]) {
        dimensions[objDimensionName].push(
          SuccessFactor.fromPlainObject(objFactor as SuccessFactor),
        );
      }
    }
    const surveys = obj.surveys.map((s: Survey) =>
      Survey.fromPlainObject(s),
    );
    let reqBazProject;
    if (obj.reqBazProject) {
      reqBazProject = ReqbazProject.fromPlainObject(
        obj.reqBazProject,
      );
    } else {
      reqBazProject = null;
    }

    return new SuccessModel(
      obj.name,
      obj.service,
      dimensions,
      surveys,
      reqBazProject as ReqbazProject,
    );
  }

  static fromXml(xml: Element) {
    try {
      const modelName = xml.getAttribute('name');
      const service = xml.getAttribute('service');
      const dimensionNodes = Array.from(
        xml.getElementsByTagName('dimension'),
      );
      const dimensions: DimensionMap = new InitialDimensionMap();
      for (const dimensionNode of dimensionNodes) {
        const dimensionName = dimensionNode.getAttribute('name');
        const availableDimensions = Object.keys(dimensions);
        if (!availableDimensions.includes(dimensionName)) {
          throw new Error(
            `${dimensionName} is not a valid dimension. Valid dimensions are ${availableDimensions.join()}`,
          );
        }
        const factorNodes = Array.from(
          dimensionNode.getElementsByTagName('factor'),
        );
        for (const factorNode of factorNodes) {
          dimensions[dimensionName].push(
            SuccessFactor.fromXml(factorNode),
          );
        }
      }
      const surveyCollectionNodes = Array.from(
        xml.getElementsByTagName('surveys'),
      );
      const surveys: Survey[] = [];
      if (surveyCollectionNodes.length > 0) {
        const collectionNode = surveyCollectionNodes[0];
        const surveyNodes = Array.from(
          collectionNode.getElementsByTagName('survey'),
        );
        for (const surveyNode of surveyNodes) {
          surveys.push(Survey.fromXml(surveyNode));
        }
      }

      const reqBazProjectNodes = Array.from(
        xml.getElementsByTagName('reqbaz-project'),
      );
      let reqBazProject: ReqbazProject = null;
      if (reqBazProjectNodes.length > 0) {
        reqBazProject = ReqbazProject.fromXml(reqBazProjectNodes[0]);
      }

      return new SuccessModel(
        modelName,
        service,
        dimensions,
        surveys,
        reqBazProject,
      );
    } catch (e) {
      throw new Error('Parsing model failed');
    }
  }

  toXml(): Element {
    const doc = document.implementation.createDocument('', '', null);
    const successModel = doc.createElement('SuccessModel');
    successModel.setAttribute('name', this.name);
    successModel.setAttribute('service', this.service);
    const questionnaires = doc.createElement('surveys');
    for (const surveyObj of this.surveys) {
      questionnaires.appendChild(surveyObj.toXml());
    }
    successModel.appendChild(questionnaires);
    if (this.reqBazProject) {
      successModel.appendChild(this.reqBazProject.toXml());
    }
    for (const dimensionName of Object.keys(this.dimensions)) {
      const dimension = doc.createElement('dimension');
      dimension.setAttribute('name', dimensionName);
      for (const factor of this.dimensions[dimensionName]) {
        dimension.appendChild(factor.toXml());
      }
      successModel.appendChild(dimension);
    }
    return successModel;
  }
}

export class SuccessFactor implements SuccessFactor {
  constructor(public name: string, public measures: string[]) {}

  static fromXml(xml: Element) {
    try {
      const factorName = xml.getAttribute('name');
      const measureNodes = Array.from(
        xml.getElementsByTagName('measure'),
      );
      const measures: string[] = [];
      for (const measureNode of measureNodes) {
        measures.push(measureNode.getAttribute('name'));
      }
      return new SuccessFactor(factorName, measures);
    } catch (e) {
      throw new Error('Parsing factor failed:');
    }
  }

  public static fromPlainObject(
    obj: PlainSuccessFactor,
  ): SuccessFactor {
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

interface PlainSuccessModel {
  name: string;
  service: string;
  dimensions: DimensionMap;
  surveys: Survey[];
  reqBazProject: ReqbazProject;
}

interface PlainSuccessFactor {
  name: string;
  measures: string[];
}
