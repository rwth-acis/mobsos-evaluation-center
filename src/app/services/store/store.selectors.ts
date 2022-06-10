/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable no-underscore-dangle */
import { createSelector } from '@ngrx/store';
import { User } from 'src/app/models/user.model';
import { GroupInformation } from '../../models/community.model';
import {
  MeasureCatalog,
  MeasureMap,
} from '../../models/measure.model';

import { Questionnaire } from '../../models/questionnaire.model';
import { ServiceInformation } from '../../models/service.model';
import { StoreState } from '../../models/state.model';
import {
  SuccessFactor,
  SuccessModel,
} from '../../models/success.model';
import { VisualizationCollection } from '../../models/visualization.model';
import {
  ApplicationWorkspace,
  CommunityWorkspace,
  UserRole,
} from '../../models/workspace.model';

// use these functions as selectors to get data from the store. Example: this.ngrxStore.select(SERVICES).subscribe(callbackFn)

/**
 * Function which returns true if any http call is currently loading
 *
 * @param state state of the store
 * @returns true if any http call is being processed
 */
export const HTTP_CALL_IS_LOADING = (state: StoreState) =>
  state.Reducer?.currentNumberOfHttpCalls > 0;

export const QUESTIONNAIRES = (state: StoreState) =>
  state.Reducer.questionnaires;

export const SURVEYS = (state: StoreState) =>
  (state.Reducer.surveys || []).concat(
    state.Reducer.limeSurveySurveys,
  );

export const REQUIREMENTS = (state: StoreState) =>
  state.Reducer.requirements;

export const NUMBER_OF_REQUIREMENTS = (state: StoreState) =>
  state.Reducer?.requirements?.length;

export const EDIT_MODE = (state: StoreState) =>
  state.Reducer?.editMode;

export const EXPERT_MODE = (state: StoreState) =>
  state.Reducer?.expertMode;

export const USER = (state: StoreState) => state.Reducer?.user;

export const AUTHENTICATED = createSelector(
  USER,
  (user) => user?.signedIn,
);

// SERVICES
export const _SELECTED_SERVICE_NAME = (state: StoreState) =>
  state.Reducer?.selectedServiceName;

export const _SERVICES = (state: StoreState) =>
  state.Reducer?.services
    ? Object.values(state.Reducer.services).sort((a, b) =>
        sortServicesByName(a, b),
      )
    : undefined;

const _SELECTED_SERVICE = (state: StoreState) =>
  state.Reducer?.services && state.Reducer.selectedServiceName
    ? state.Reducer.services[state.Reducer.selectedServiceName]
    : undefined;

// GROUPS
export const _SELECTED_GROUP_ID = (state: StoreState) =>
  state.Reducer?.selectedGroupId;

const _GROUPS = (state: StoreState) => state.Reducer?.groups;

export const GROUPS = (state: StoreState) =>
  state.Reducer.groups === undefined
    ? undefined
    : state.Reducer.groups === null
    ? []
    : Object.values(state.Reducer.groups).sort((a, b) =>
        sortGroupsByName(a, b),
      );

export const USER_GROUPS = createSelector(GROUPS, (groups) =>
  groups?.filter((g) => g.member),
);
/**
 * @deprecated we can only fetch our own groups using the contact service
 */
export const FOREIGN_GROUPS = createSelector(GROUPS, (groups) =>
  groups?.filter((g) => !g.member),
);

export const SELECTED_GROUP = createSelector(
  _SELECTED_GROUP_ID,
  _GROUPS,
  (groupId, groups) => (groups ? groups[groupId] : undefined),
);

export const SELECTED_GROUP_MEMBERS = createSelector(
  SELECTED_GROUP,
  (group) => (group ? group.members : undefined),
);

export const IS_MEMBER_OF_SELECTED_GROUP = createSelector(
  SELECTED_GROUP,
  USER,
  (group, user) => !!user && group?.member,
);

export const LIMESURVEY_RESPONSES = (state: StoreState) =>
  state.Reducer.limeSurveyResponses;

export const RESPONSES_FOR_LIMESURVEY = (props: { sid: string }) =>
  createSelector(LIMESURVEY_RESPONSES, (res) =>
    res ? res[props.sid] : undefined,
  );

export const QUESTIONS_FROM_LIMESURVEY = (props: { sid: string }) =>
  createSelector(LIMESURVEY_RESPONSES, (res) =>
    res && props.sid in res
      ? res[props.sid].map((response) => ({
          statement: response.question,
          type: response.type,
        }))
      : undefined,
  );

// WORKSPACE
export const SELECTED_WORKSPACE_OWNER = (state: StoreState) =>
  state.Reducer.currentWorkSpaceOwner;

const _CURRENT_WORKSPACE_OWNER = (state: StoreState) =>
  state.Reducer?.currentWorkSpaceOwner;

export const _COMMUNITY_WORKSPACE = (state: StoreState) =>
  state.Reducer?.communityWorkspace;

export const CURRENT_USER_WORKSPACE = createSelector(
  _COMMUNITY_WORKSPACE,
  _CURRENT_WORKSPACE_OWNER,
  USER,
  (communityWorkspace, owner, user) =>
    getCurrentUserWorkspace(
      owner,
      communityWorkspace,
      user?.profile?.preferred_username,
    ),
);

export const APPLICATION_WORKSPACE = createSelector(
  CURRENT_USER_WORKSPACE,
  _SELECTED_SERVICE_NAME,
  (userWorkspace, serviceName) =>
    userWorkspace && serviceName
      ? userWorkspace[serviceName]
      : undefined,
);

export const ALL_WORKSPACES_FOR_SELECTED_SERVICE = createSelector(
  _COMMUNITY_WORKSPACE,
  _SELECTED_SERVICE_NAME,
  (workspace, selectedServiceName) =>
    getAllWorkspacesForService(workspace, selectedServiceName),
);

export const WORKSPACE_OWNER = createSelector(
  APPLICATION_WORKSPACE,
  (appworkspace) => appworkspace?.createdBy,
);

export const ALL_WORKSPACES_FOR_SELECTED_SERVICE_EXCEPT_ACTIVE =
  createSelector(
    ALL_WORKSPACES_FOR_SELECTED_SERVICE,
    WORKSPACE_OWNER,
    (workspaces, owner) =>
      workspaces?.filter(
        (workspace: ApplicationWorkspace) =>
          workspace?.createdBy !== owner,
      ),
  );

export const VISITORS = createSelector(
  APPLICATION_WORKSPACE,
  (
    workspace, // need to copy visitors because object is readonly
  ) =>
    workspace?.visitors
      ? [...workspace?.visitors].sort((a, b) =>
          a.username?.localeCompare(b.username),
        )
      : undefined,
);

export const ROLE_IN_CURRENT_WORKSPACE = createSelector(
  APPLICATION_WORKSPACE,
  USER,
  (appWorkspace, user) =>
    user?.signedIn
      ? getUserRoleInWorkspace(
          appWorkspace,
          user?.profile?.preferred_username,
        )
      : 'Lurker',
);

export const USER_HAS_EDIT_RIGHTS = createSelector(
  EDIT_MODE,
  ROLE_IN_CURRENT_WORKSPACE,
  (editMode, role) =>
    editMode &&
    (role.toLowerCase() === 'owner' ||
      role.toLowerCase() === 'editor'),
);

export const USER_IS_OWNER_IN_CURRENT_WORKSPACE = createSelector(
  APPLICATION_WORKSPACE,
  USER,
  (workspace, user) =>
    workspace?.createdBy === user?.profile.preferred_username,
);

// SUCCESS MODEL
export const SUCCESS_MODEL_FROM_NETWORK = (state: StoreState) =>
  state.Reducer?.successModel;

export const SUCCESS_MODEL_FROM_WORKSPACE = createSelector(
  APPLICATION_WORKSPACE,
  (workspace) => workspace?.model,
);

export const SUCCESS_MODEL = createSelector(
  EDIT_MODE,
  SUCCESS_MODEL_FROM_NETWORK,
  SUCCESS_MODEL_FROM_WORKSPACE,
  USER,
  (
    editMode,
    successModelFromNetwork,
    successModelInWorkspace,
    user,
  ) => {
    return successModelInWorkspace
      ? editMode || user.role === UserRole.LURKER
        ? successModelInWorkspace
        : successModelFromNetwork
      : successModelFromNetwork;
  },
);

export const REQBAZ_PROJECT = createSelector(
  SUCCESS_MODEL,
  (model) => {
    return model?.reqBazProject;
  },
);

export const DIMENSIONS_IN_MODEL = createSelector(
  SUCCESS_MODEL,
  (model) =>
    model?.dimensions
      ? (Object.values(model.dimensions) as [SuccessFactor[]])
      : undefined,
);

export const SUCCESS_MODEL_IS_EMPTY = createSelector(
  DIMENSIONS_IN_MODEL,
  (dimensions) =>
    !dimensions?.some((dimension) => dimension.length > 0),
);

export const SURVEYS_FROM_SUCCESS_MODEL = createSelector(
  SUCCESS_MODEL,
  (model) => model?.surveys,
);

export const SURVEYS_NOT_IN_MODEL = createSelector(
  SURVEYS_FROM_SUCCESS_MODEL,
  SURVEYS,
  (surveysInModels, surveys) =>
    surveysInModels
      ? surveys?.filter(
          (survey) =>
            !surveysInModels.find(
              (surveyInModel) => surveyInModel.id === survey.id,
            ),
        )
      : surveys,
);

export const RESTRICTED_MODE = (state: StoreState) =>
  !state.Reducer?.user.signedIn;

export const SUCCESS_MODEL_XML = createSelector(
  SUCCESS_MODEL,
  (model) =>
    model
      ? SuccessModel.fromPlainObject(model)?.toXml()?.outerHTML
      : undefined,
);

export const WORKSPACE_MODEL = createSelector(
  APPLICATION_WORKSPACE,
  (workspace) => workspace?.model,
);

export const WORKSPACE_MODEL_XML = createSelector(
  WORKSPACE_MODEL,
  (model) =>
    model
      ? SuccessModel.fromPlainObject(model as any)?.toXml()?.outerHTML
      : undefined,
);

// MEASURE CATALOG
export const MEASURE_CATALOG_FROM_NETWORK = (state: StoreState) =>
  state.Reducer?.measureCatalog;

export const MEASURE_CATALOG_FROM_WORKSPACE = createSelector(
  APPLICATION_WORKSPACE,
  (workspace) => workspace?.catalog,
);

export const MEASURE_CATALOG = createSelector(
  EDIT_MODE,
  MEASURE_CATALOG_FROM_NETWORK,
  MEASURE_CATALOG_FROM_WORKSPACE,
  (
    editMode,
    measureCatalogFromNetwork,
    measureCatalogFromWorkspace,
  ) =>
    editMode
      ? measureCatalogFromWorkspace
      : measureCatalogFromNetwork,
);

export const MEASURES = createSelector(
  MEASURE_CATALOG,
  (catalog) => catalog?.measures,
);

export const MEASURE = (props: { measureName: string }) =>
  createSelector(MEASURES, (measures: MeasureMap) =>
    measures ? measures[props.measureName] : undefined,
  );

export const MEASURE_CATALOG_XML = (state: StoreState) =>
  state.Reducer.measureCatalog
    ? MeasureCatalog.fromJSON(state.Reducer.measureCatalog)?.toXml()
        ?.outerHTML
    : undefined;

export const WORKSPACE_CATALOG = createSelector(
  APPLICATION_WORKSPACE,
  (workspace) => workspace?.catalog,
);

export const QUESTIONNAIRE = (props: { id: number }) =>
  createSelector(QUESTIONNAIRES, (qs: Questionnaire[]) =>
    qs ? qs.find((q) => q.id === props.id) : undefined,
  );

export const WORKSPACE_CATALOG_XML = createSelector(
  WORKSPACE_CATALOG,
  (catalog) =>
    catalog
      ? MeasureCatalog.fromJSON(catalog)?.toXml()?.outerHTML
      : undefined,
);

// VISUALIZATION_DATA
export const VISUALIZATION_DATA_FROM_QVS = (state: StoreState) =>
  state.Reducer?.visualizationData;

export const VISUALIZATION_DATA_FROM_WORKSPACE = createSelector(
  APPLICATION_WORKSPACE,
  (workspace) => workspace?.visualizationData,
);

export const VISUALIZATION_DATA = createSelector(
  VISUALIZATION_DATA_FROM_QVS,
  VISUALIZATION_DATA_FROM_WORKSPACE,
  EDIT_MODE,
  (datafromQVS, dataFromWorkspace, editMode) =>
    editMode && dataFromWorkspace ? dataFromWorkspace : datafromQVS,
);

export const VISUALIZATION_DATA_FOR_QUERY = (props: {
  queryString: string;
}) =>
  createSelector(
    VISUALIZATION_DATA_FROM_QVS,
    VISUALIZATION_DATA_FROM_WORKSPACE,
    (
      workspacedata: VisualizationCollection,
      qvsdata: VisualizationCollection,
    ) =>
      workspacedata && workspacedata[props.queryString]
        ? workspacedata[props.queryString]
        : qvsdata
        ? qvsdata[props.queryString]
        : undefined,
  );

export const MODEL_AND_CATALOG_LOADED = createSelector(
  SUCCESS_MODEL,
  MEASURE_CATALOG,
  (model, catalog) => !!model && !!catalog,
);

/**
 * gets the service which is currently selected by the user.
 * Visitors dont have access to all service so the selected service is deduced from the application workspace
 */
export const SELECTED_SERVICE = createSelector(
  _SELECTED_SERVICE,
  APPLICATION_WORKSPACE,
  (service, workspace) => (service ? service : workspace?.service),
);

function sortGroupsByName(
  a: GroupInformation,
  b: GroupInformation,
): number {
  if (a.name?.toLocaleLowerCase() < b.name?.toLocaleLowerCase()) {
    return -1;
  } else return 1;
}
function sortServicesByName(
  a: ServiceInformation,
  b: ServiceInformation,
): number {
  if (a.alias && !b.alias) return -1;
  else if (b.alias && !a.alias) return 1;
  if (a.alias && b.alias) {
    if (a.alias?.toLocaleLowerCase() < b.alias?.toLocaleLowerCase())
      return -1;
    else return 1;
  } else {
    if (a.name?.toLocaleLowerCase() < b.name?.toLocaleLowerCase())
      return -1;
    else return 1;
  }
}

function getUserRoleInWorkspace(
  applicationWorkspace: ApplicationWorkspace,
  userName: string,
): string {
  if (!userName || !applicationWorkspace) {
    return null;
  }
  if (applicationWorkspace?.createdBy === userName) {
    return UserRole.OWNER;
  }
  const visitors = applicationWorkspace.visitors || [];
  const visitorSearchResult = visitors?.find(
    (visitor) => visitor.username === userName,
  );
  if (visitorSearchResult) {
    return visitorSearchResult.role;
  }
  return UserRole.SPECTATOR;
}

function getAllWorkspacesForService(
  workspace: CommunityWorkspace,
  serviceName: string,
): ApplicationWorkspace[] {
  if (!workspace) {
    return null;
  }
  const result = [];
  if (!serviceName) {
    return [];
  }
  const userWorkspaces = Object.values(workspace);
  for (const userWorkspace of userWorkspaces) {
    if (Object.keys(userWorkspace).includes(serviceName)) {
      result.push(userWorkspace[serviceName]);
    }
  }
  return (result as ApplicationWorkspace[])?.sort((a, b) =>
    a.createdBy?.localeCompare(b.createdBy),
  );
}

/**
 * Get the workspace for the current workspace.
 *
 * @param owner The owner of the current user workspace
 * @param communityWorkspace The workspace of the community
 * @param user The current user
 * @returns If owner is provided, then the workspace of the owner is returned. Else the workspace of the user is returned
 */
function getCurrentUserWorkspace(
  owner: string,
  communityWorkspace: CommunityWorkspace,
  user: string,
) {
  if (!communityWorkspace) return null;
  if (owner && communityWorkspace[owner])
    return communityWorkspace[owner];
  return communityWorkspace[user];
}
