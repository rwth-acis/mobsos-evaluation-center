import { createAction, props } from '@ngrx/store';
import { User } from '../models/user.model';

enum FetchActions {
  FETCH_SERVICES = 'Fetch services from the network',
  FETCH_GROUPS = 'fetch groups from the network',
  FETCH_SERVICE_MESSAGE_DESCRIPTION = 'fetch service descriptions for a service from the network ',
  FETCH_MEASURE_CATALOG_FOR_GROUP = 'fetch measure catalog for current Group',
  FETCH_SUCCESS_MODEL_FOR_GROUP_AND_SERVICE = 'fetch success model for current Group and current service',
}

enum StoreActions {
  STORE_SERVICE_MESSAGE_DESCRIPTION = 'store the service descriptions for a service from the network',
  STORE_SERVICES = 'store services',
  STORE_GROUPS = 'store groups',
  STORE_USER = 'Store the user',
  STORE_MEASURE_CATALOG = 'Store the measure catalog as xml string',
  STORE_SUCCESS_MODEL = 'Store the success model as xml string',
}

enum StateActions {
  SET_GROUP = 'set current group',
  SET_SERVICE = 'set the current service',
  TOGGLE_EDIT = 'toggle edit mode for success model',
  INCREMENT_LOADING = 'Increase the number of current http calls',
  DECREMENT_LOADING = 'Decrease the number of current http calls',
}

export const fetchServices = createAction(FetchActions.FETCH_SERVICES);
export const fetchGroups = createAction(FetchActions.FETCH_GROUPS);
export const fetchMeasureCatalog = createAction(
  FetchActions.FETCH_MEASURE_CATALOG_FOR_GROUP,
  props<{ groupId: string }>()
);

export const fetchSuccessModel = createAction(
  FetchActions.FETCH_SUCCESS_MODEL_FOR_GROUP_AND_SERVICE,
  props<{ groupId; serviceName }>()
);
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

export const storeCatalogXML = createAction(
  StoreActions.STORE_MEASURE_CATALOG,
  props<{ xml: string }>()
);

export const storeSuccessModelXML = createAction(
  StoreActions.STORE_SUCCESS_MODEL,
  props<{ xml: string }>()
);

export const incrementLoading = createAction(StateActions.INCREMENT_LOADING);

export const decrementLoading = createAction(StateActions.INCREMENT_LOADING);

export const toggleEdit = createAction(StateActions.TOGGLE_EDIT);
