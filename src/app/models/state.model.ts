import { Questionnaire } from '../las2peer.service';
import {
  GroupCollection,
  GroupInformation,
  ServiceCollection,
  ServiceInformation,
} from '../store.service';
import { VisualizationCollection } from './visualization.model';

export interface AppState {
  services: ServiceCollection;
  groups: GroupCollection;
  user: object;
  selectedGroup: GroupInformation;
  selectedService: ServiceInformation;
  editMode: boolean;
  questionnaires: Questionnaire[];
  messageDescriptions: object;
  visualizations: VisualizationCollection;
}
