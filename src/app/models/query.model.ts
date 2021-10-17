export class Query {
  constructor(public name: string, public sql: string) {}

  static fromXml(xml: Element): Query {
    const queryName = xml.getAttribute('name');
    const sql = xml.innerHTML;
    return new Query(queryName, sql);
  }

  public static fromPlainObject(obj: {
    name: string;
    sql: string;
  }): Query {
    return new Query(obj.name, obj.sql);
  }

  toXml(): Element {
    const doc = document.implementation.createDocument('', '', null);
    const query = doc.createElement('query');
    query.setAttribute('name', this.name);
    query.innerHTML = this.sql;
    return query;
  }
}
