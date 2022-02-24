// interface for questionnaire which describes the questionnaires received from the surveys backend
export interface Questionnaire {
  id: number;
  description?: string;
  lang?: string;
  logo?: string;
  name: string;
  organization?: string;
  owner?: string;
  url?: string;
  formXML?: string;
  surveyId: number;
}
// internal questionnaire class
export class Questionnaire implements Questionnaire {
  constructor(
    public name: string,
    public id: number,
    public surveyId: number,
    public description?: string,
  ) {}

  static fromXml(xml: Element): Questionnaire {
    const name = xml.getAttribute('name');
    const id = parseInt(xml.getAttribute('id'), 10);
    const surveyId = parseInt(xml.getAttribute('surveyId'), 10);
    return new Questionnaire(name, id, surveyId);
  }

  public static fromPlainObject(obj: Questionnaire): Questionnaire {
    return new Questionnaire(
      obj.name,
      obj.id,
      obj.surveyId,
      obj.description,
    );
  }

  toXml(): Element {
    const doc = document.implementation.createDocument('', '', null);
    const questionnaire = doc.createElement('questionnaire');
    questionnaire.setAttribute('name', this.name);
    questionnaire.setAttribute('id', this.id.toString());
    questionnaire.setAttribute('surveyId', this.surveyId.toString());
    return questionnaire;
  }
}

export interface Question {
  code: string;
  type: 'ordinal' | 'dichotomous';
  dimensionRecommendation: string;
  factorRecommendation: string;
  instructions: string;
}
