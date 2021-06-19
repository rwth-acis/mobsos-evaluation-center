import { GroupCollection } from './community.model';
import { MeasureCatalog } from './measure.catalog';
import { IQuestionnaire } from './questionnaire.model';
import { ServiceCollection } from './service.model';
import { SuccessModel } from './success.model';
import { User } from './user.model';
import { VisualizationData } from './visualization.model';
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
  questionnaires: IQuestionnaire[];
  messageDescriptions: object;
  visualizationData: VisualizationData;
  successModel: SuccessModel;
  successModelInitialized: boolean;
  measureCatalog: MeasureCatalog;
  measureCatalogInitialized: boolean;
  currentNumberOfHttpCalls: number;
  expertMode: boolean;
  communityWorkspace: CommunityWorkspace;
  currentWorkSpaceOwner: string;
  joinedUsingLink: boolean;
}

export const INITIAL_APP_STATE: AppState = {
  services: {},
  groups: undefined,
  user: undefined,
  selectedGroupId: undefined,
  selectedServiceName: undefined,
  editMode: false,
  questionnaires: [],
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
  joinedUsingLink: false,
};
/**
 * What the store looks like
 */
export interface StoreState {
  Reducer: AppState;
}
