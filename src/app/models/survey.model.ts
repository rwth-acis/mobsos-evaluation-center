export interface ISurvey {
  start: Date; // Start date of the survey
  end: Date; // End date of the survey
  id: number | string; // ID of the survey
  name: string; // Name of the survey
}

export class Survey implements ISurvey {
  description?: string; // Description of the survey
  start: Date; // Start date of the survey
  end: Date; // End date of the survey
  id: number; // ID of the survey
  lang: string; // Language of the survey
  logo?: string; // Logo of the survey
  name: string; // Name of the survey
  organization?: string; // Organization to which the survey belongs
  owner: string; // Owner of the survey
  url?: string; // URL at which the survey can be found
  qid: number; // ID of the questionnaire
  resource: string; // Resource on which the survey is based (e.g. a service)
  'resource-label'?: string; // Resource label of the survey
  constructor(form: SurveyForm) {
    this.description = form?.description;
    this.start = new Date(form.start);
    this.end = new Date(form.end);
    this.id = form.id;
    this.lang = form.lang;
    this.logo = form.logo;
    this.name = form.name;
    this.organization = form.organization;
    this.owner = form.owner;
    this.url = form.url;
    this.qid = form.qid;
    this.resource = form.resource;
    this['resource-label'] = form['resource-label'];
  }
  static fromPlainObject(s: Survey): Survey {
    return new Survey({
      name: s.name,
      id: s.id,
      qid: s.qid,
      description: s.description,
    });
  }
  static fromXml(xml: Element): Survey {
    const name = xml.getAttribute('name');
    const id = parseInt(xml.getAttribute('id'), 10);
    const qid = parseInt(xml.getAttribute('qid'), 10);
    return new Survey({ name, id, qid });
  }
  toXml(): Element {
    const doc = document.implementation.createDocument('', '', null);
    const questionnaire = doc.createElement('survey');
    questionnaire.setAttribute('name', this.name);
    questionnaire.setAttribute('qid', this.qid.toString());
    questionnaire.setAttribute('id', this.id.toString());
    return questionnaire;
  }
}

export class LimeSurvey implements ISurvey {
  start: Date; // Start date of the survey
  end: Date; // End date of the survey
  id: string; // ID of the survey
  name: string; // Name of the survey
  constructor(form: LimeSurveyForm) {
    this.start = new Date(form.startdate);
    this.end = new Date(form.expires);
    this.id = form.sid;
    this.name = form.title;
  }
}

interface SurveyForm {
  description?: string;
  start?: string;
  end?: string;
  id?: number;
  lang?: string;
  logo?: string;
  name?: string;
  organization?: string;
  owner?: string;
  url?: string;
  qid?: number;
  resource?: string;
  'resource-label'?: string;
}

export interface LimeSurveyForm {
  sid: string;
  title: string;
  startdate: string;
  active: 'Y' | 'N';
  expires: string;
}

export interface LimeSurveyResponses {
  question: string;
  title: string;
  type: 'L' | '5' | 'S' | 'T';
  responses: { [response: string]: number }; // counts how much each response was voted
}
