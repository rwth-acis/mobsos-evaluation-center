import { GroupCollection } from './community.model';
import { MeasureCatalog } from './measure.catalog';
import { IQuestionnaire, Questionnaire } from './questionnaire.model';
import { Requirement } from './reqbaz.model';
import { ServiceCollection } from './service.model';
import { SuccessModel } from './success.model';
import { User } from './user.model';
import { VisualizationCollection } from './visualization.model';
import { CommunityWorkspace } from './workspace.model';

/**
 * state of the app
 */
export interface AppState {
  services: ServiceCollection;
  groups: GroupCollection;
  user: User;
  selectedGroupId: string;
  selectedServiceName: string;
  editMode: boolean;
  messageDescriptions: object;
  visualizationData: VisualizationCollection;
  successModel: SuccessModel;
  successModelInitialized: boolean;
  measureCatalog: MeasureCatalog;
  measureCatalogInitialized: boolean;
  currentNumberOfHttpCalls: number;
  expertMode: boolean;
  communityWorkspace: CommunityWorkspace;
  currentWorkSpaceOwner: string;
  restricted: boolean;
  requirements: Requirement[];
}

export const INITIAL_APP_STATE: AppState = {
  services: {},
  groups: undefined,
  user: undefined,
  selectedGroupId: undefined,
  selectedServiceName: undefined,
  editMode: false,
  messageDescriptions: undefined,
  visualizationData: {},
  measureCatalog: undefined,
  measureCatalogInitialized: false,
  successModel: undefined,
  successModelInitialized: false,
  currentNumberOfHttpCalls: 0,
  expertMode: false,
  communityWorkspace: undefined,
  currentWorkSpaceOwner: undefined,
  restricted: false,
  requirements: undefined,
};
/**
 * What the store looks like
 */
export interface StoreState {
  Reducer: AppState;
}
