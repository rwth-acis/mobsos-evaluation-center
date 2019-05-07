export class Query {
  name;
  sql;

  constructor(name: string, sql: string) {
  }

  static fromXml(xml: Element): Query {
    const queryName = xml.getAttribute('name');
    const sql = xml.innerHTML;
    return new Query(queryName, sql);
  }

  toXml() {

  }
}
