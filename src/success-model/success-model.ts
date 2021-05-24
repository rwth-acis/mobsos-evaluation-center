import { SuccessFactor } from './success-factor';
import { merge } from 'lodash-es';
import { Questionnaire } from './questionnaire';
import { ReqbazProject } from './reqbaz-project';
import { ServiceInformation } from 'src/app/models/service.model';

export interface DimensionMap {
  'System Quality': SuccessFactor[];
  'Information Quality': SuccessFactor[];
  Use: SuccessFactor[];
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
  constructor(
    public name: string,
    public service: string,
    public dimensions: DimensionMap,
    public questionnaires: Questionnaire[],
    public reqBazProject: ReqbazProject
  ) {}

  public static fromPlainObject(obj: SuccessModel): SuccessModel {
    const dimensions: DimensionMap = merge({}, initialDimensionMap);
    for (const objDimensionName of Object.keys(obj.dimensions)) {
      dimensions[objDimensionName] = [];
      for (const objFactor of obj.dimensions[objDimensionName]) {
        dimensions[objDimensionName].push(
          SuccessFactor.fromPlainObject(objFactor)
        );
      }
    }
    const questionnaires = [];
    for (const objQuestionnaire of obj.questionnaires) {
      if (objQuestionnaire) {
        questionnaires.push(Questionnaire.fromPlainObject(objQuestionnaire));
      }
    }
    let reqBazProject;
    if (obj.reqBazProject) {
      reqBazProject = ReqbazProject.fromPlainObject(obj.reqBazProject);
    } else {
      reqBazProject = null;
    }

    return new SuccessModel(
      obj.name,
      obj.service,
      dimensions,
      questionnaires,
      reqBazProject
    );
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
          throw new Error(
            `${dimensionName} is not a valid dimension. Valid dimensions are ${availableDimensions.join()}`
          );
        }
        const factorNodes = Array.from(
          dimensionNode.getElementsByTagName('factor')
        );
        for (const factorNode of factorNodes) {
          dimensions[dimensionName].push(SuccessFactor.fromXml(factorNode));
        }
      }
      const questionnaireCollectionNodes = Array.from(
        xml.getElementsByTagName('questionnaires')
      );
      const questionnaires = [];
      if (questionnaireCollectionNodes.length > 0) {
        const questionnaireCollectionNode = questionnaireCollectionNodes[0];
        const questionnaireNodes = Array.from(
          questionnaireCollectionNode.getElementsByTagName('questionnaire')
        );
        for (const questionnaireNode of questionnaireNodes) {
          questionnaires.push(Questionnaire.fromXml(questionnaireNode));
        }
      }

      const reqBazProjectNodes = Array.from(
        xml.getElementsByTagName('reqbaz-project')
      );
      let reqBazProject = null;
      if (reqBazProjectNodes.length > 0) {
        reqBazProject = ReqbazProject.fromXml(reqBazProjectNodes[0]);
      }

      return new SuccessModel(
        modelName,
        service,
        dimensions,
        questionnaires,
        reqBazProject
      );
    } catch (e) {
      throw new Error('Parsing model failed: ' + e);
    }
    return null;
  }

  toXml(): Element {
    const doc = document.implementation.createDocument('', '', null);
    const successModel = doc.createElement('SuccessModel');
    successModel.setAttribute('name', this.name);
    successModel.setAttribute('service', this.service);
    const questionnaires = doc.createElement('questionnaires');
    for (const questionnaireObj of this.questionnaires) {
      questionnaires.appendChild(questionnaireObj.toXml());
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
