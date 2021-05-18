import { Questionnaire } from '../las2peer.service';
import {
  GroupCollection,
  GroupInformation,
  ServiceCollection,
  ServiceInformation,
} from '../store.service';
import { VisualizationData } from './visualization.model';
import { ApplicationWorkspace } from './workspace.model';

/**
 * state of the app
 */
export interface AppState {
  services: ServiceCollection;
  groups: GroupCollection;
  user: object;
  selectedGroup: GroupInformation;
  selectedGroupId: string;
  selectedServiceName: string;
  selectedService: ServiceInformation;
  editMode: boolean;
  questionnaires: Questionnaire[];
  messageDescriptions: object;
  visualizationData: VisualizationData;
  successModelXML: string;
  successModelInitialized: boolean;
  measureCatalogXML: string;
  measureCatalogInitialized: boolean;
  currentNumberOfHttpCalls: number;
  expertMode: boolean;
  currentApplicationWorkspace: ApplicationWorkspace;
}
/**
 * What the store looks like
 */
export interface StoreState {
  Reducer: AppState;
}
