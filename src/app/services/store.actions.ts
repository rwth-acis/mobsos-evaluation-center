import { createAction, props } from '@ngrx/store';
import { ServiceInformation } from '../store.service';

enum ActionType {
  FETCH_SERVICES = 'Fetch services from the network',
  STORE_SERVICES = 'store services',
}

export const fetchServices = createAction(ActionType.FETCH_SERVICES);
export const storeServices = createAction(
  ActionType.STORE_SERVICES,
  props<{ servicesFromL2P; servicesFromMobSOS }>()
);
