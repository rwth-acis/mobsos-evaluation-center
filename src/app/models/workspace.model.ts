import { MeasureCatalog } from './measure.model';
import { Requirement } from './reqbaz.model';
import { ServiceInformation } from './service.model';
import { SuccessModel } from './success.model';

import { VisualizationCollection } from './visualization.model';

export interface ApplicationWorkspace {
  createdAt: string; // Date when the workspace was created (ISO)
  createdBy: string; // User who created the workspace
  visitors: Visitor[]; // List of users who have visited the workspace
  model: SuccessModel; // Success model of the workspace
  catalog: MeasureCatalog; // Catalog of measures
  service: ServiceInformation; // Service information
  visualizationData: VisualizationCollection; // Visualization data
  requirements?: Requirement[]; // Requirements
}

export interface Visitor {
  name: string; // Name of the visitor
}

export interface UserWorkspace {
  // service name is key
  [key: string]: ApplicationWorkspace;
}
export interface CommunityWorkspace {
  // user ID is key
  [key: string]: UserWorkspace;
}
export class Visitor implements Visitor {
  constructor(public username: string, public role: UserRole) {}
}

export enum UserRole {
  SPECTATOR = 'spectator',
  EDITOR = 'editor',
  LURKER = 'lurker',
}
