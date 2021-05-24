import { createAction, props } from '@ngrx/store';
import { SuccessFactor } from 'src/success-model/success-factor';
import { Measure } from '../models/measure.model';
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

export enum PostActions {
  SAVE_MODEL_AND_CATALOG = 'send an update to the server',
  SUCCESS_RESPONSE = 'response was successfully',
  FAILURE_RESPONSE = 'response was not successfully',
  SAVE_CATALOG_SUCCESS = 'successfully saved the catalog on the server',
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
  ADD_FACTOR_TO_DIMENSION = 'add a factor to a success dimension',
  EDIT_FACTOR_IN_DIMENSION = 'updates a specific factor for a dimension',
  ADD_MEASURE_TO_CATALOG = 'adds a measure to the catalog',
  ADD_MEASURE_TO_SUCCESS_FACTOR = 'adds a measure to the success model',
  EDIT_MEASURE = 'updates an existing measure ',
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
  INITIALIZE_STATE = 'Initializes the state of the application. This action should only be called once.',
}

//fetching
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

//storing
export const storeServices = createAction(
  StoreActions.STORE_SERVICES,
  props<{ servicesFromL2P; servicesFromMobSOS }>()
);
export const addFactorToDimension = createAction(
  StoreActions.ADD_FACTOR_TO_DIMENSION,
  props<{ factor: SuccessFactor; dimensionName: string }>()
);
export const editFactorInDimension = createAction(
  StoreActions.EDIT_FACTOR_IN_DIMENSION,
  props<{
    factor: SuccessFactor;
    oldFactorName: string;
    dimensionName: string;
  }>()
);
export const addMeasureToCatalog = createAction(
  StoreActions.ADD_MEASURE_TO_CATALOG,
  props<{ measure: Measure }>()
);
export const addMeasureToFactor = createAction(
  StoreActions.ADD_MEASURE_TO_CATALOG,
  props<{ measure: Measure; factorName: string; dimensionName: string }>()
);

export const editMeasure = createAction(
  StoreActions.EDIT_MEASURE,
  props<{
    measure: Measure;
    oldMeasureName: string;
    factorName: string;
    dimensionName: string;
  }>()
);
export const storeGroups = createAction(
  StoreActions.STORE_SERVICES,
  props<{ groupsFromContactService; groupsFromMobSOS }>()
);

export const saveModelAndCatalog = createAction(
  PostActions.SAVE_MODEL_AND_CATALOG
);

export const setGroup = createAction(
  StateActions.SET_GROUP,
  props<{ groupId: string }>()
);

export const setService = createAction(
  StateActions.SET_SERVICE,
  props<{ service: ServiceInformation }>()
);

export const storeUser = createAction(
  StoreActions.STORE_USER,
  props<{ user: User }>()
);

export const storeVisualizationData = createAction(
  FetchActions.FETCH_VISUALIZATION_DATA,
  props<{ data: any; query: string }>()
);

export const storeCatalog = createAction(
  StoreActions.STORE_MEASURE_CATALOG,
  props<{ xml: string }>()
);

export const storeSuccessModel = createAction(
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

// modes
export const incrementLoading = createAction(StateActions.INCREMENT_LOADING);
export const initState = createAction(StateActions.INITIALIZE_STATE);
export const decrementLoading = createAction(StateActions.DECREMENT_LOADING);
export const toggleEdit = createAction(StateActions.TOGGLE_EDIT);
export const enableEdit = createAction(StateActions.ENABLE_EDIT);
export const disableEdit = createAction(StateActions.DISABLE_EDIT);
export const toggleExpertMode = createAction(StateActions.TOGGLE_EXPERT_MODE);

// http results
export const successResponse = createAction(PostActions.SUCCESS_RESPONSE);
export const saveCatalogSuccess = createAction(
  PostActions.SAVE_CATALOG_SUCCESS
);
export const failureResponse = createAction(
  PostActions.FAILURE_RESPONSE,
  props<{ reason: Error }>()
);