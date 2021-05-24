import { Questionnaire } from '../las2peer.service';
import {
  GroupCollection,
  GroupInformation,
  ServiceCollection,
  ServiceInformation,
} from '../store.service';
import { MeasureCatalog } from './measure.catalog';
import { SuccessModel } from './success.model';
import { VisualizationData } from './visualization.model';
import { ApplicationWorkspace } from './workspace.model';

/**
 * state of the app
 */
export interface AppState {
  services: ServiceCollection;
  groups: GroupCollection;
  user: object;
  selectedGroupId: string;
  selectedServiceName: string;
  selectedService: ServiceInformation;
  editMode: boolean;
  questionnaires: Questionnaire[];
  messageDescriptions: object;
  visualizationData: VisualizationData;
  successModel: SuccessModel;

  successModelInitialized: boolean;
  measureCatalog: MeasureCatalog;

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
