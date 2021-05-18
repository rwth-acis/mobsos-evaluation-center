import { createAction, props } from '@ngrx/store';
import { SuccessFactor } from 'src/success-model/success-factor';
import { ServiceInformation } from '../models/service.model';
import { User } from '../models/user.model';
import {
  ApplicationWorkspace,
  CommunityWorkspace,
} from '../models/workspace.model';

enum FetchActions {
  FETCH_SERVICES = 'Fetch services from the network',
  FETCH_GROUPS = 'fetch groups from the network',
  FETCH_SERVICE_MESSAGE_DESCRIPTION = 'fetch service descriptions for a service from the network ',
  FETCH_MEASURE_CATALOG_FOR_GROUP = 'fetch measure catalog for current Group',
  FETCH_SUCCESS_MODEL_FOR_GROUP_AND_SERVICE = 'fetch success model for current Group and current service',
  FETCH_VISUALIZATION_DATA = 'fetch visualization data from the qvs for a given sql query',
}

enum StoreActions {
  STORE_SERVICE_MESSAGE_DESCRIPTION = 'store the service descriptions for a service from the network',
  STORE_SERVICES = 'store services',
  STORE_GROUPS = 'store groups',
  STORE_USER = 'Store the user',
  STORE_MEASURE_CATALOG = 'Store the measure catalog as xml string',
  STORE_SUCCESS_MODEL = 'Store the success model as xml string',
  STORE_VISUALIZATION_DATA = 'Store visualization data from the qvs',
  UPDATE_APPLICATION_WORKSPACE = 'updates the current application workspace',
  UPDATE_COMMUNITY_WORKSPACE = 'updates the current application workspace',
  EDIT_FACTOR = 'updates a specific factor for a dimension',
}

enum StateActions {
  SET_GROUP = 'set current group',
  SET_SERVICE = 'set the current service',
  TOGGLE_EDIT = 'toggle edit mode for success model',
  ENABLE_EDIT = 'enable edit mode for success model',
  DISABLE_EDIT = 'disable edit mode for success model',
  INCREMENT_LOADING = 'Increase the number of current http calls',
  DECREMENT_LOADING = 'Decrease the number of current http calls',
  TOGGLE_EXPERT_MODE = 'Toggle the expert mode for raw edit of success model and measure catalog',
}

export const fetchServices = createAction(FetchActions.FETCH_SERVICES);
export const fetchGroups = createAction(FetchActions.FETCH_GROUPS);
export const fetchVisualizationData = createAction(
  FetchActions.FETCH_VISUALIZATION_DATA,
  props<{ query: string; queryParams: string[] }>()
);
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
  props<{ service: ServiceInformation }>()
);

export const storeUser = createAction(
  StoreActions.STORE_USER,
  props<{ user: User }>()
);

export const editFactorForDimension = createAction(
  StoreActions.EDIT_FACTOR,
  props<{ factor: SuccessFactor; dimensionName: string }>()
);

export const storeVisualizationData = createAction(
  FetchActions.FETCH_VISUALIZATION_DATA,
  props<{ data: any; query: string }>()
);

export const storeCatalogXML = createAction(
  StoreActions.STORE_MEASURE_CATALOG,
  props<{ xml: string }>()
);

export const storeSuccessModelXML = createAction(
  StoreActions.STORE_SUCCESS_MODEL,
  props<{ xml: string }>()
);
export const updateAppWorkspace = createAction(
  StoreActions.UPDATE_APPLICATION_WORKSPACE,
  props<{ workspace: ApplicationWorkspace }>()
);

export const updateCommunityWorkspace = createAction(
  StoreActions.UPDATE_COMMUNITY_WORKSPACE,
  props<{ workspace: CommunityWorkspace }>()
);

export const incrementLoading = createAction(StateActions.INCREMENT_LOADING);

export const decrementLoading = createAction(StateActions.DECREMENT_LOADING);

export const toggleEdit = createAction(StateActions.TOGGLE_EDIT);
export const enableEdit = createAction(StateActions.ENABLE_EDIT);
export const disableEdit = createAction(StateActions.DISABLE_EDIT);

export const toggleExpertMode = createAction(StateActions.TOGGLE_EDIT);
