import { MeasureCatalog } from './measure.catalog';
import { ServiceInformation } from './service.model';
import { SuccessModel } from './success.model';
import { Visitor } from './user.model';

export interface ApplicationWorkspace {
  createdAt: string;
  createdBy: string;
  visitors: Visitor[];
  model: SuccessModel;
  catalog: MeasureCatalog;
  service: ServiceInformation;
}

export interface UserWorkspace {
  // service name is key
  [key: string]: ApplicationWorkspace;
}
export interface CommunityWorkspace {
  // user ID is key
  [key: string]: UserWorkspace;
}
