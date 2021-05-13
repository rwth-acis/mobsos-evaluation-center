import { createAction, props } from '@ngrx/store';
import { User } from '../models/user.model';

enum FetchActions {
  FETCH_SERVICES = 'Fetch services from the network',
  FETCH_GROUPS = 'fetch groups from the network',
  FETCH_SERVICE_MESSAGE_DESCRIPTION = 'fetch service descriptions for a service from the network ',
}

enum StoreActions {
  STORE_SERVICE_MESSAGE_DESCRIPTION = 'store the service descriptions for a service from the network',
  STORE_SERVICES = 'store services',
  STORE_GROUPS = 'store groups',
  STORE_USER = 'Store the user',
}

enum StateActions {
  SET_GROUP = 'set current group',
  SET_SERVICE = 'set the current service',
  TOGGLE_EDIT = 'toggle edit mode for success model',
}

export const fetchServices = createAction(FetchActions.FETCH_SERVICES);
export const fetchGroups = createAction(FetchActions.FETCH_GROUPS);

export const storeServices = createAction(
  StoreActions.STORE_SERVICES,
  props<{ servicesFromL2P; servicesFromMobSOS }>()
);
export const storeGroups = createAction(
  StoreActions.STORE_SERVICES,
  props<{ groupsFromContactService; groupsFromMobSOS }>()
);

export const setGroup = createAction(
  StoreActions.STORE_SERVICES,
  props<{ groupId: string }>()
);

export const setService = createAction(
  StoreActions.STORE_SERVICES,
  props<{ serviceName: string }>()
);

export const storeUser = createAction(
  StoreActions.STORE_USER,
  props<{ user: User }>()
);

export const toggleEdit = createAction(StateActions.TOGGLE_EDIT);
