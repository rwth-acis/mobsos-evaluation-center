import { MeasureCatalog } from './measure.model';
import { Requirement } from './reqbaz.model';
import { ServiceInformation } from './service.model';
import { SuccessModel } from './success.model';

import { VisualizationCollection } from './visualization.model';

export interface ApplicationWorkspace {
  createdAt: string;
  createdBy: string;
  visitors: Visitor[];
  model: SuccessModel;
  catalog: MeasureCatalog;
  service: ServiceInformation;
  visualizationData: VisualizationCollection;
  requirements?: Requirement[];
}

export interface UserWorkspace {
  // service name is key
  [key: string]: ApplicationWorkspace;
}
export interface CommunityWorkspace {
  // user ID is key
  [key: string]: UserWorkspace;
}
export class Visitor {
  constructor(public username: string, public role: UserRole) {}
}

export enum UserRole {
  SPECTATOR = 'spectator',
  EDITOR = 'editor',
  LURKER = 'lurker',
}
