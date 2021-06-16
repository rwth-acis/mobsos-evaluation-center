import { MeasureCatalog } from './measure.catalog';
import { SuccessModel } from './success.model';
import { Visitor } from './user.model';

export interface ApplicationWorkspace {
  createdAt: string;
  createdBy: string;
  visitors: Visitor[];
  model: SuccessModel;
  catalog: MeasureCatalog;
}

export interface UserWorkspace {
  // service name is key
  [key: string]: ApplicationWorkspace;
}
export interface CommunityWorkspace {
  // user ID is key
  [key: string]: UserWorkspace;
}
