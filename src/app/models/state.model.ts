import { GroupCollection } from './community.model';
import { MeasureCatalog } from './measure.model';
import { Questionnaire } from './questionnaire.model';
import { Requirement } from './reqbaz.model';
import { ServiceCollection } from './service.model';
import { SuccessModel } from './success.model';
import {
  LimeSurveyForm,
  LimeSurveyResponses,
  Survey,
} from './survey.model';
import { User } from './user.model';
import { VisualizationCollection } from './visualization.model';
import { CommunityWorkspace } from './workspace.model';

/**
 * state of the app
 */
export interface AppState {
  services: ServiceCollection; // services available in the las2peer network are stored in this collection
  groups: GroupCollection; // groups available in the las2peer network that the user is part of are stores in this collection
  user: User; // Information about the current user
  selectedGroupId: string; // id of the selected group
  selectedServiceName: string; // name of the selected service
  editMode: boolean; // true if the user is in edit mode
  messageDescriptions: any; // message descriptions for the services in the las2peer network. This field should be obsolete since we are storing the message descriptions in the services collection
  visualizationData: VisualizationCollection; // data for the visualizations
  successModel: SuccessModel; // success model for the currently selected group and service
  successModelInitialized: boolean; // true if the success model has been initialized. Should be obsolete since we can check successModel
  measureCatalog: MeasureCatalog; // measure catalog for the currently selected group
  measureCatalogInitialized: boolean; // true if the measure catalog has been initialized. Should be obsolete since we can check measureCatalog
  currentNumberOfHttpCalls: number; // current number of http calls to the las2peer network used to display the loading progress bar
  expertMode: boolean; // true if the user is in expert mode. Expert mode allows the user to edit and inspect various aspects of the app in raw format and can be used for debugging purposes
  communityWorkspace: CommunityWorkspace; // community workspace for the selected group . This holds all the information that is shared between the community members through yjs
  currentWorkSpaceOwner: string; // username of the user that created and owns the current work space. This might be different from the user that is logged in.
  requirements: Requirement[]; // requirements for the Requirement Bazaar project that is connected to the current success model
  questionnaires: Questionnaire[]; // questionnaires from mobsos surveys
  surveys: Survey[]; // surveys from mobsos surveys
  limeSurveySurveys: LimeSurveyForm[]; // surveys from limesurvey
  limeSurveyResponses: { [sid: string]: LimeSurveyResponses }; // responses from limesurvey per survey referenced by the surveyid
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
  requirements: undefined,
  questionnaires: undefined,
  surveys: undefined,
  limeSurveySurveys: undefined,
  limeSurveyResponses: undefined,
};
/**
 * What the store looks like
 */
export interface StoreState {
  Reducer: AppState;
}
