import { MeasureCatalog } from 'src/success-model/measure-catalog';
import { SuccessModel } from 'src/success-model/success-model';
import { Visitor } from './user.model';

export interface ApplicationWorkspace {
  // This is the workspace for a given application. It is shared with other members of the community and is unique for each service
  createdBy: string; // original author
  visitors: Visitor[]; // visitors of the room
  model: SuccessModel;
}
export interface ServiceWorkspaces {
  // each service has its own application workspace
  [serviceName: string]: ApplicationWorkspace;
}
export interface CommunityWorkspace {
  members?: string[]; // username of members
  catalog: MeasureCatalog; // measure Catalog is shared by the whole community
  workspaces: ServiceWorkspaces;
}
