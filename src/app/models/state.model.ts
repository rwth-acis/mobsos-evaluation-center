import { Questionnaire } from '../las2peer.service';
import { GroupCollection, ServiceCollection } from '../store.service';

export interface AppState {
  services: ServiceCollection;
  groups: GroupCollection;
  user: object;
  selectedGroup: string;
  selectedService: string;
  editMode: boolean;
  questionnaires: Questionnaire[];
  messageDescriptions: object;
}
