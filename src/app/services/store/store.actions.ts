import { HttpErrorResponse } from '@angular/common/http';
import { createAction, props } from '@ngrx/store';
import {
  GroupInformation,
  GroupMember,
} from '../../models/community.model';

import { Measure } from '../../models/measure.model';
import { Questionnaire } from '../../models/questionnaire.model';
import {
  ReqbazProject,
  Requirement,
} from '../../models/reqbaz.model';
import {
  ServiceInformation,
  ServicesFromL2P,
  ServicesFromMobSOS,
} from '../../models/service.model';
import { SuccessFactor } from '../../models/success.model';
import {
  ISurvey,
  LimeSurveyForm,
  LimeSurveyResponse,
  Survey,
} from '../../models/survey.model';
import { User } from '../../models/user.model';

import {
  CommunityWorkspace,
  UserRole,
} from '../../models/workspace.model';

/**
 * Actions to load from backend services
 */

export enum HttpActions {
  FETCH_SERVICES = 'Fetch services from the network',
  FETCH_GROUPS = 'fetch groups from the network',
  FETCH_GROUP_MEMBERS = 'fetch gorup members for a given group from the network',
  FETCH_SERVICE_MESSAGE_DESCRIPTIONS = 'fetch service descriptions for a service from the network ',
  FETCH_MEASURE_CATALOG_FOR_GROUP = 'fetch measure catalog for current Group',
  FETCH_SUCCESS_MODEL_FOR_GROUP_AND_SERVICE = 'fetch success model for current Group and current service',
  FETCH_VISUALIZATION_DATA = 'fetch visualization data from the qvs for a given sql query',
  FETCH_QUESTIONNAIRES = 'fetch questionnaires from the mobsos surveys',
  FETCH_SURVEYS = 'fetch surveys from the mobsos surveys',
  FETCH_QUESTIONNAIRE_FORM = 'Fetch questionnaire form from the mobsos surveys',
  SAVE_MODEL_AND_CATALOG = 'send an update to the server for both model and catalog',
  SAVE_CATALOG = 'save catalog on the server',
  SAVE_MODEL = 'save model on the server',
  UPDATE_MODEL = 'This action takes the current local success model and saves it on the server',
  SAVE_CATALOG_SUCCESS = 'successfully saved the catalog on the server',
  REFRESH_VISUALIZATION = 'Refresh the current visualization manually',
  ADD_GROUP = 'adds a new group on the server',
  ADD_USER_TO_GROUP = 'adds a new user to the current group',
  REMOVE_MEMBER_FROM_GROUP = 'removes a member from the current group',
  SUCCESS_RESPONSE = 'response was successful',
  FAILURE_RESPONSE = 'response was not successful',
  FETCH_SURVEYS_FROM_LIMESURVEY = 'Fetches the list of surveys available in LimeSurvey',
  FETCH_SURVEY_RESPONSE_FOR_SURVEY_FROM_LIMESURVEY = 'Fetches the responses for a particular survey from LimeSurvey',
}
/**
 * Actions that store data in the state store
 */
export enum StoreActions {
  STORE_SERVICE_MESSAGE_DESCRIPTIONS = 'store the service descriptions for a service from the network',
  STORE_SERVICES = 'store services',
  STORE_GROUPS = 'store groups',
  STORE_USER = 'Store the user',
  LOGOUT_USER = 'log out the user by deleting the user from the store',
  STORE_GROUP = 'Stores a new group in state',
  STORE_GROUP_MEMBERS = 'Stores the group members for a given group',
  STORE_USERNAME = 'Set the username. Called for anonymous users',
  STORE_MEASURE_CATALOG = 'Store the measure catalog as xml string',
  STORE_SUCCESS_MODEL = 'Store the success model as xml string',
  STORE_VISUALIZATION_DATA = 'Store visualization data from the qvs',
  STORE_MODEL_IN_WORKSPACE = 'Store the model in the current workspace',
  STORE_CATALOG_IN_WORKSPACE = 'Store the catalog in the current workspace',
  UPDATE_COMMUNITY_WORKSPACE = 'updates the current application workspace',
  ADD_FACTOR_TO_DIMENSION = 'add a factor to a success dimension',
  REMOVE_FACTOR_FROM_DIMENSION = 'remove a factor from a success dimension',
  REMOVE_MEASURE_FROM_MODEL = 'remove a measure from the success model',
  REMOVE_MEASURE_FROM_CATALOG = 'remove a measure from the measure catalog',
  EDIT_FACTOR_IN_DIMENSION = 'updates a specific factor for a dimension',
  ADD_MEASURE_TO_CATALOG = 'adds a measure to the catalog',
  ADD_MEASURE_TO_SUCCESS_FACTOR = 'adds a measure to the success model',
  ADD_SURVEY_TO_MODEL = 'adds a survey to the success model',
  REMOVE_SURVEY_FROM_MODEL = 'removes a survey from the success model',
  EDIT_MEASURE = 'updates an existing measure in catalog and success model',
  EDIT_MEASURE_IN_CATALOG = 'updates an existing measure in catalog only ',
  SET_COMMUNITY_WORKSPACE = 'update the community workspace',
  SET_COMMUNITY_WORKSPACE_OWNER = 'set the selected community workspace owner',
  REMOVE_VISUALIZATION_DATA = ' Removes visualization data for a given query',
  ADD_REQUIREMENTS_BAZAR_PROJECT = 'add a requirement bazar project to the success model',
  REMOVE_REQUIREMENTS_BAZAR_PROJECT = 'remove a requirement bazar project from the success model',
  STORE_REQUIREMENTS = 'Store the requirements for the current req bazar project',
  SET_NUMBER_OF_REQUIREMENTS = 'set the number of requirements for the current project',
  STORE_QUESTIONNAIRES = 'store the fetched questionnaires in store',
  STORE_SURVEYS = 'store the fetched surveys in store',
  REMOVE_SURVEY_MEASURES_FROM_MODEL = 'Remove the measures which were autogenerated from the survey',
  RESET_SUCCESS_MODEL = 'Sets the success model to undefined',
  ADD_MEASURES_TO_CATALOG = 'Add a list of measures to the catalog',
  UPDATE_GROUP = 'update a group',
  STORE_QUESTIONNAIRE_FORM = 'Store the form for a given questionnaire',
  STORE_SURVEYS_FROM_LIMESURVEY = 'Store surveys from limesurvey ',
  STORE_RESPONSES_FOR_SURVEY_FROM_LIMESURVEY = 'store the responses for a given Limesurvey',
}

/**
 * Actions which manipulate the state of the application
 */

export enum StateActions {
  SET_GROUP = 'set current group',
  TRANSFER_MISSING_GROUPS_TO_MOBSOS = 'transfer groups from the contact service which are not known to mobsos to mobsos',
  SET_SERVICE = 'set the current service',
  SET_SERVICE_NAME = 'set the current service by providing the name',
  SET_USER_AS_VISITOR = 'set the user as a visitor',
  JOIN_WORKSPACE = 'Join the workspace of another user',
  ADD_SUCCESS_MODEL_TO_WORKSPACE = 'add the success model to the workspace',
  ADD_CATALOG_TO_WORKSPACE = 'add the catalog to the workspace',
  TOGGLE_EDIT = 'toggle edit mode for success model',
  ENABLE_EDIT = 'enable edit mode for success model',
  DISABLE_EDIT = 'disable edit mode for success model',
  INCREMENT_LOADING = 'Increase the number of current http calls',
  DECREMENT_LOADING = 'Decrease the number of current http calls',
  TOGGLE_EXPERT_MODE = 'Toggle the expert mode for raw edit of success model and measure catalog',
  RESET_FETCH_DATE = 'set the fetch date to null',
  INITIALIZE_STATE = 'Initializes the state of the application. This action should only be called once.',
  NOOP = 'No operation',
  RESET_WORKSPACE = 'Reset the users current workspace to the default state. This deletes the success model, catalog and visualization data',
}

// fetching
export const fetchServices = createAction(HttpActions.FETCH_SERVICES);
export const fetchGroups = createAction(HttpActions.FETCH_GROUPS);
export const fetchSurveysFromLimeSurvey = createAction(
  HttpActions.FETCH_SURVEYS_FROM_LIMESURVEY,
);
export const fetchResponsesForSurveyFromLimeSurvey = createAction(
  HttpActions.FETCH_SURVEY_RESPONSE_FOR_SURVEY_FROM_LIMESURVEY,
  props<{ sid: string }>(),
);
export const fetchVisualizationData = createAction(
  HttpActions.FETCH_VISUALIZATION_DATA,
  props<{ query: string; cache?: boolean }>(),
);
export const fetchMessageDescriptions = createAction(
  HttpActions.FETCH_SERVICE_MESSAGE_DESCRIPTIONS,
  props<{ serviceName: string }>(),
);
export const fetchMeasureCatalog = createAction(
  HttpActions.FETCH_MEASURE_CATALOG_FOR_GROUP,
  props<{ groupId?: string }>(),
);
export const fetchSuccessModel = createAction(
  HttpActions.FETCH_SUCCESS_MODEL_FOR_GROUP_AND_SERVICE,
  props<{ groupId?: string; serviceName?: string }>(),
);

export const fetchQuestionnaires = createAction(
  HttpActions.FETCH_QUESTIONNAIRES,
);

export const fetchSurveys = createAction(HttpActions.FETCH_SURVEYS);

// storing
export const storeSurveysFromLimeSurvey = createAction(
  StoreActions.STORE_SURVEYS_FROM_LIMESURVEY,
  props<{ surveys: ISurvey[] }>(),
);

export const storeResponsesForSurveyFromLimeSurvey = createAction(
  StoreActions.STORE_RESPONSES_FOR_SURVEY_FROM_LIMESURVEY,
  props<{
    responses: LimeSurveyResponse[];
    sid: string;
    fetchDate: number;
  }>(),
);

export const storeMessageDescriptions = createAction(
  StoreActions.STORE_SERVICE_MESSAGE_DESCRIPTIONS,
  props<{
    descriptions: { [key: string]: string };
    serviceName: string;
  }>(),
);
export const addSurveyToModel = createAction(
  StoreActions.ADD_SURVEY_TO_MODEL,
  props<{
    survey: Survey;
    addMeasures?: boolean;
    assignMeasures?: boolean;
  }>(),
);
export const removeSurveyFromModel = createAction(
  StoreActions.REMOVE_SURVEY_FROM_MODEL,
  props<{ id: number }>(),
);
export const removeSurveyMeasuresFromModel = createAction(
  StoreActions.REMOVE_SURVEY_MEASURES_FROM_MODEL,
  props<{ measureTag: string }>(),
);
export const storeQuestionnaires = createAction(
  StoreActions.STORE_QUESTIONNAIRES,
  props<{ questionnaires: Questionnaire[] }>(),
);
export const storeSurveys = createAction(
  StoreActions.STORE_SURVEYS,
  props<{ surveys: Survey[] }>(),
);

export const storeServices = createAction(
  StoreActions.STORE_SERVICES,
  props<{
    servicesFromL2P: ServicesFromL2P;
    servicesFromMobSOS: ServicesFromMobSOS;
  }>(),
);
export const addFactorToDimension = createAction(
  StoreActions.ADD_FACTOR_TO_DIMENSION,
  props<{ factor: SuccessFactor; dimensionName: string }>(),
);
export const removeVisualizationDataForQuery = createAction(
  StoreActions.REMOVE_VISUALIZATION_DATA,
  props<{ query: string }>(),
);
export const editFactorInDimension = createAction(
  StoreActions.EDIT_FACTOR_IN_DIMENSION,
  props<{
    factor: SuccessFactor;
    oldFactorName: string;
    dimensionName: string;
  }>(),
);

export const addReqBazarProject = createAction(
  StoreActions.ADD_REQUIREMENTS_BAZAR_PROJECT,
  props<{
    project: ReqbazProject;
  }>(),
);

export const addGroup = createAction(
  HttpActions.ADD_GROUP,
  props<{ groupName: string }>(),
);
export const storeGroup = createAction(
  StoreActions.STORE_GROUP,
  props<{ group: GroupInformation }>(),
);
export const updateGroup = createAction(
  StoreActions.UPDATE_GROUP,
  props<{ group: GroupInformation }>(),
);
export const removeReqBazarProject = createAction(
  StoreActions.REMOVE_REQUIREMENTS_BAZAR_PROJECT,
);
export const storeRequirements = createAction(
  StoreActions.STORE_REQUIREMENTS,
  props<{
    requirements: Requirement[];
  }>(),
);

/**
 * @deprecated set requirements directly
 */
export const setNumberOfRequirements = createAction(
  StoreActions.SET_NUMBER_OF_REQUIREMENTS,
  props<{
    n: number;
  }>(),
);

export const addMeasureToCatalog = createAction(
  StoreActions.ADD_MEASURE_TO_CATALOG,
  props<{ measure: Measure }>(),
);
export const addMeasuresToCatalog = createAction(
  StoreActions.ADD_MEASURES_TO_CATALOG,
  props<{ measures: Measure[] }>(),
);
export const addMeasureToFactor = createAction(
  StoreActions.ADD_MEASURE_TO_CATALOG,
  props<{
    measure: Measure;
    factorName: string;
    dimensionName: string;
  }>(),
);

export const editMeasure = createAction(
  StoreActions.EDIT_MEASURE,
  props<{
    measure: Measure;
    oldMeasureName: string;
    factorName: string;
    dimensionName: string;
    catalogOnly?: boolean;
  }>(),
);

export const editMeasureInCatalog = createAction(
  StoreActions.EDIT_MEASURE_IN_CATALOG,
  props<{
    measure: Measure;
    oldMeasureName: string;
  }>(),
);
export const storeGroups = createAction(
  StoreActions.STORE_GROUPS,
  props<{
    groupsFromContactService: {
      [key: string]: string;
    };
  }>(),
);

export const removeFactor = createAction(
  StoreActions.REMOVE_FACTOR_FROM_DIMENSION,
  props<{ name: string }>(),
);

export const removeMeasureFromModel = createAction(
  StoreActions.REMOVE_MEASURE_FROM_MODEL,
  props<{ name: string }>(),
);

export const removeMeasureFromCatalog = createAction(
  StoreActions.REMOVE_MEASURE_FROM_CATALOG,
  props<{ name: string }>(),
);

export const saveModelAndCatalog = createAction(
  HttpActions.SAVE_MODEL_AND_CATALOG,
);

export const saveModel = createAction(
  HttpActions.SAVE_MODEL,
  props<{ xml: string }>(),
);

export const transferMissingGroupsToMobSOS = createAction(
  StateActions.TRANSFER_MISSING_GROUPS_TO_MOBSOS,
  props<{ groupsFromContactService; groupsFromMobSOS }>(),
);

export const saveCatalog = createAction(
  HttpActions.SAVE_CATALOG,
  props<{ xml: string }>(),
);
export const fetchQuestionnaireForm = createAction(
  HttpActions.FETCH_QUESTIONNAIRE_FORM,
  props<{ questionnaireId: number }>(),
);
export const storeQuestionnaireForm = createAction(
  StoreActions.STORE_QUESTIONNAIRE_FORM,
  props<{ formXML: string; questionnaireId: number }>(),
);
export const setGroup = createAction(
  StateActions.SET_GROUP,
  props<{ groupId: string }>(),
);

export const setService = createAction(
  StateActions.SET_SERVICE,
  props<{ service: ServiceInformation }>(),
);

export const setServiceName = createAction(
  StateActions.SET_SERVICE_NAME,
  props<{ serviceName: string }>(),
);

export const resetWorkSpace = createAction(
  StateActions.RESET_WORKSPACE,
);

export const setCommunityWorkspace = createAction(
  StoreActions.SET_COMMUNITY_WORKSPACE,
  props<{
    workspace: CommunityWorkspace;
  }>(),
);

export const setCommunityWorkspaceOwner = createAction(
  StoreActions.SET_COMMUNITY_WORKSPACE_OWNER,
  props<{
    owner?: string;
  }>(),
);

export const storeUser = createAction(
  StoreActions.STORE_USER,
  props<{ user: User }>(),
);
export const logout = createAction(StoreActions.LOGOUT_USER);

export const storeVisualizationData = createAction(
  StoreActions.STORE_VISUALIZATION_DATA,
  props<{ data?: any; query?: string; error?: any }>(),
);

export const storeCatalog = createAction(
  StoreActions.STORE_MEASURE_CATALOG,
  props<{ xml: string }>(),
);

export const storeSuccessModel = createAction(
  StoreActions.STORE_SUCCESS_MODEL,
  props<{ xml: string }>(),
);

export const resetSuccessModel = createAction(
  StoreActions.RESET_SUCCESS_MODEL,
);

export const updateCommunityWorkspace = createAction(
  StoreActions.UPDATE_COMMUNITY_WORKSPACE,
  props<{ workspace: CommunityWorkspace }>(),
);

export const joinWorkSpace = createAction(
  StateActions.JOIN_WORKSPACE,
  props<{
    groupId?: string;
    serviceName?: string;
    owner?: string;
    username?: string;
    role?: UserRole;
    copyModel?: boolean;
  }>(),
);

export const setUserAsVisitor = createAction(
  StateActions.SET_USER_AS_VISITOR,
);

export const setUserName = createAction(
  StoreActions.STORE_USERNAME,
  props<{ username: string }>(),
);
export const refreshVisualization = createAction(
  HttpActions.REFRESH_VISUALIZATION,
  props<{ query: string }>(),
);
export const resetFetchDate = createAction(
  StateActions.RESET_FETCH_DATE,
  props<{ query: string }>(),
);

export const incrementLoading = createAction(
  StateActions.INCREMENT_LOADING,
);
export const initState = createAction(StateActions.INITIALIZE_STATE);
export const decrementLoading = createAction(
  StateActions.DECREMENT_LOADING,
);
export const toggleEdit = createAction(StateActions.TOGGLE_EDIT);
export const enableEdit = createAction(StateActions.ENABLE_EDIT);
export const disableEdit = createAction(StateActions.DISABLE_EDIT);
export const toggleExpertMode = createAction(
  StateActions.TOGGLE_EXPERT_MODE,
);

// http results
export const successResponse = createAction(
  HttpActions.SUCCESS_RESPONSE,
);
export const saveCatalogSuccess = createAction(
  HttpActions.SAVE_CATALOG_SUCCESS,
);
export const updateSuccessModel = createAction(
  HttpActions.UPDATE_MODEL,
);
export const failureResponse = createAction(
  HttpActions.FAILURE_RESPONSE,
  props<{ reason: HttpErrorResponse }>(),
);

export const addModelToWorkSpace = createAction(
  StateActions.ADD_SUCCESS_MODEL_TO_WORKSPACE,
  props<{ xml: string }>(),
);
export const addCatalogToWorkspace = createAction(
  StateActions.ADD_CATALOG_TO_WORKSPACE,
  props<{ xml: string }>(),
);

export const storeModelInWorkspace = createAction(
  StoreActions.STORE_MODEL_IN_WORKSPACE,
  props<{ xml: string }>(),
);

export const storeCatalogInWorkspace = createAction(
  StoreActions.STORE_CATALOG_IN_WORKSPACE,
  props<{ xml: string }>(),
);

export const fetchGroupMembers = createAction(
  HttpActions.FETCH_GROUP_MEMBERS,
  props<{ groupId?: string }>(),
);
export const storeGroupMembers = createAction(
  StoreActions.STORE_GROUP_MEMBERS,
  props<{ groupMembers: GroupMember[]; groupId: string }>(),
);

export const addUserToGroup = createAction(
  HttpActions.ADD_USER_TO_GROUP,
  props<{ username: string }>(),
);

export const removeMemberFromGroup = createAction(
  HttpActions.REMOVE_MEMBER_FROM_GROUP,
  props<{ username: string }>(),
);

export const success = createAction('action was successful');

export const failure = createAction(
  'action was not successful',
  props<{ reason?: any }>(),
);

export const noop = createAction(StateActions.NOOP);
