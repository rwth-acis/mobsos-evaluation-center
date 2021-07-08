export class ReqbazProject {
  constructor(
    public name: string,
    public id: number,
    public categoryId: number,
  ) {}

  static fromXml(xml: Element): ReqbazProject {
    const name = xml.getAttribute('name');
    const id = parseInt(xml.getAttribute('id'), 10);
    const categoryId = parseInt(xml.getAttribute('categoryId'), 10);
    return new ReqbazProject(name, id, categoryId);
  }

  public static fromPlainObject(obj: ReqbazProject): ReqbazProject {
    return new ReqbazProject(obj.name, obj.id, obj.categoryId);
  }

  toXml(): Element {
    const doc = document.implementation.createDocument('', '', null);
    const questionnaire = doc.createElement('reqbaz-project');
    questionnaire.setAttribute('name', this.name);
    questionnaire.setAttribute('id', this.id.toString());
    questionnaire.setAttribute(
      'categoryId',
      this.categoryId.toString(),
    );
    return questionnaire;
  }
}

export interface Requirement {
  id: number;
  name: string;
  description: string;
  projectId: number;
  creator: {
    id: number;
    userName: string;
    firstName: string;
    lastName: string;
    admin: false;
    las2peerId: any;
    profileImage: string;
    emailLeadSubscription: boolean;
    emailFollowSubscription: boolean;
  };
  categories: Category[];
  creationDate: Date;
  numberOfComments: number;
  numberOfAttachments: number;
  numberOfFollowers: number;
  upVotes: number;

  downVotes: number;
  userVoted: string;
  realized?: Date;
}

export interface Category {
  id: number;
  name: string;
  description: string;
  projectId: number;
}
