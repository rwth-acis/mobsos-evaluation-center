export interface Survey {
  description: string;
  start: Date;
  end: Date;
  id: number;
  lang: string;
  logo: string;
  name: string;
  organization: string;
  owner: string;
  url: string;
  qid: number;
  resource: string;
  'resource-label': string;
}

export interface SurveyForm {
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

export class Survey implements Survey {
  static fromPlainObject(s: Survey): any {
    return new Survey({
      name: s.name,
      id: s.id,
      qid: s.qid,
      description: s.description,
    });
  }
  toXml(): Element {
    const doc = document.implementation.createDocument('', '', null);
    const questionnaire = doc.createElement('survey');
    questionnaire.setAttribute('name', this.name);
    questionnaire.setAttribute('qid', this.qid.toString());
    questionnaire.setAttribute('id', this.id.toString());
    return questionnaire;
  }
  static fromXml(xml: Element): Survey {
    const name = xml.getAttribute('name');
    const id = parseInt(xml.getAttribute('id'), 10);
    const qid = parseInt(xml.getAttribute('qid'), 10);
    return new Survey({ name, id, qid });
  }
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
}
