export interface Project {
  name: string; // Name of the project
  id: number; // ID of the project
  categoryId: number; // ID of the category to which the project belongs
}

export class ReqbazProject implements Project {
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
/**
 * Requirement from the Requirements Bazaar
 */
export interface Requirement {
  id: number; // ID of the requirement
  name: string; // Name of the requirement
  description: string; // Description of the requirement
  projectId: number; // ID of the project to which the requirement belongs
  creator: {
    // Creator of the requirement
    id: number; // ID of the creator
    userName: string; // Name of the creator
    firstName: string; // First name of the creator
    lastName: string; // Last name of the creator
    admin: false; // Is the creator an administrator?
    las2peerId: any; // AgnetID of the creator in the LAS2peer system
    profileImage: string; // URL of the profile image of the creator
    emailLeadSubscription: boolean;
    emailFollowSubscription: boolean;
  };
  categories: Category[]; // Categories to which the requirement belongs
  creationDate: Date; // Date on which the requirement was created
  numberOfComments: number; // Number of comments on the requirement
  numberOfAttachments: number; // Number of attachments on the requirement
  numberOfFollowers: number; // Number of followers of the requirement
  upVotes: number; // Number of up votes on the requirement
  downVotes: number; // Number of down votes on the requirement
  userVoted: string;
  realized?: Date; // Date on which the requirement was realized
  leadDeveloper?: { userName: string }; // Lead developer of the requirement
}
/**
 * A single category in the Requirements Bazaar
 */
export interface Category {
  id: number; // ID of the category
  name: string; // Name of the category
  description: string; // Description of the category
  projectId: number; // ID of the project to which the category belongs
}
