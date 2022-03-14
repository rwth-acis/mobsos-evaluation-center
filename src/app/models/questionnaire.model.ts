export interface Questionnaire {
  id: number; // ID of the questionnaire
  description: string; // Description of the questionnaire
  lang: string; // Language of the questionnaire
  logo: string; // Logo of the questionnaire
  name: string; // Name of the questionnaire
  organization: string; // Organization to which the questionnaire belongs
  owner: string; // Owner of the questionnaire
  url: string; // URL at which the questionnaire can be found
  formXML: string; // XML form of the questionnaire
}
// internal questionnaire class
export class Questionnaire implements Questionnaire {
  constructor(
    public name: string,
    public id: number,
    public surveyId: number,
    public description: string = '',
  ) {}

  static fromXml(xml: Element): Questionnaire {
    const name = xml.getAttribute('name');
    const id = parseInt(xml.getAttribute('id'), 10);
    const surveyId = parseInt(xml.getAttribute('surveyId'), 10);
    return new Questionnaire(name, id, surveyId);
  }

  public static fromJSONObject(obj: Questionnaire): Questionnaire {
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
/**
 * A single question from a questionnaire
 */
export interface Question {
  code: string; // Code of the question
  type: 'ordinal' | 'dichotomous'; // Type of the question
  dimensionRecommendation: string; // Dimension recommendation of the question in the success model
  factorRecommendation: string; // Factor recommendation of the question in the success model
  instructions: string; // Instructions for the question (the actual question)
  labels?: QuestionLabels; // Labels for the question
}

interface QuestionLabels {
  [key: string]: string;
}
