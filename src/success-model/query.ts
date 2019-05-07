export class Query {

  constructor(public name: string, public sql: string) {
  }

  static fromXml(xml: Element): Query {
    const queryName = xml.getAttribute('name');
    const sql = xml.innerHTML;
    return new Query(queryName, sql);
  }

  toXml() {

  }
}
