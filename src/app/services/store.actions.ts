import { createAction, props } from '@ngrx/store';

enum ActionType {
  FETCH_SERVICES = 'Fetch services from the network',
  FETCH_GROUPS = 'fetch groups from the network',
  FETCH_SERVICE_MESSAGE_DESCRIPTION = 'fetch service descriptions for a service from the network ',
  STORE_SERVICE_MESSAGE_DESCRIPTION = 'store the service descriptions for a service from the network',
  STORE_SERVICES = 'store services',
  STORE_GROUPS = 'store groups',
  SET_GROUP = 'set current group',
}

export const fetchServices = createAction(ActionType.FETCH_SERVICES);
export const fetchGroups = createAction(ActionType.FETCH_GROUPS);

export const storeServices = createAction(
  ActionType.STORE_SERVICES,
  props<{ servicesFromL2P; servicesFromMobSOS }>()
);
export const storeGroups = createAction(
  ActionType.STORE_SERVICES,
  props<{ groupsFromContactService; groupsFromMobSOS }>()
);

export const setGroup = createAction(
  ActionType.STORE_SERVICES,
  props<{ groupId: string }>()
);
