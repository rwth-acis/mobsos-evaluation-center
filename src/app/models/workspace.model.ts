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

export class ApplicationWorkspace implements ApplicationWorkspace {
  constructor(
    public createdBy: string,
    public visitors: Visitor[],
    public model: SuccessModel,
    public catalog: MeasureCatalog,
    public service: ServiceInformation,
    public visualizationData: VisualizationCollection,
    public requirements?: Requirement[],
  ) {
    this.createdAt = Date.now().toString();
  }
}

export class EmptyApplicationWorkspace extends ApplicationWorkspace {
  constructor(
    public override createdBy: string,
    public override service: ServiceInformation,
  ) {
    super(
      createdBy,
      [],
      undefined,
      undefined,
      service,
      undefined,
      undefined,
    );
    this.createdAt = Date.now().toLocaleString();
  }
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
  SPECTATOR = 'Spectator',
  EDITOR = 'Editor',
  LURKER = 'Lurker',
  OWNER = 'Owner',
}
