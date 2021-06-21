import { createSelector } from '@ngrx/store';
import {
  GroupCollection,
  GroupInformation,
} from '../models/community.model';
import {
  MeasureCatalog,
  MeasureMap,
} from '../models/measure.catalog';
import { ServiceInformation } from '../models/service.model';
import { StoreState } from '../models/state.model';
import { SuccessModel } from '../models/success.model';
import { User } from '../models/user.model';
import {
  ApplicationWorkspace,
  CommunityWorkspace,
} from '../models/workspace.model';

// use these functions as selectors to get data from the store. Example: this.ngrxStore.select(SERVICES).subscribe((services)=>{...})
export const EDIT_MODE = (state: StoreState) =>
  state.Reducer?.editMode;

export const EXPERT_MODE = (state: StoreState) =>
  state.Reducer?.expertMode;

export const SELECTED_SERVICE_NAME = (state: StoreState) =>
  state.Reducer?.selectedServiceName;

export const SELECTED_GROUP_ID = (state: StoreState) =>
  state.Reducer?.selectedGroupId;

export const SERVICES = (state: StoreState) =>
  state.Reducer?.services
    ? Object.values(state.Reducer.services).sort((a, b) =>
        sortServicesByName(a, b),
      )
    : undefined;

export const GROUPS = (state: StoreState) =>
  state.Reducer?.groups
    ? Object.values(state.Reducer.groups).sort((a, b) =>
        sortGroupsByName(a, b),
      )
    : undefined;

const _GROUPS = (state: StoreState) => state.Reducer?.groups;

export const VISUALIZATION_DATA = (state: StoreState) =>
  state.Reducer?.visualizationData;

const _SUCCESS_MODEL_INIT = (state: StoreState) =>
  state.Reducer?.successModelInitialized;

const _MEASURE_CATALOG_INIT = (state: StoreState) =>
  state.Reducer?.measureCatalogInitialized;

export const SELECTED_GROUP = createSelector(
  SELECTED_GROUP_ID,
  _GROUPS,
  (groupId, groups) => (groups ? groups[groupId] : undefined),
);

export const USER_GROUPS = (state: StoreState) =>
  _userGroups(state.Reducer?.groups);

export const FOREIGN_GROUPS = (state: StoreState) =>
  _foreignGroups(state.Reducer?.groups);

const CURRENT_WORKSPACE_OWNER = (state: StoreState) =>
  state.Reducer?.currentWorkSpaceOwner;

export const USER = (state: StoreState) =>
  state.Reducer?.user as User;

export const COMMUNITY_WORKSPACE = (state: StoreState) =>
  state.Reducer?.communityWorkspace;

export const CURRENT_USER_WORKSPACE = createSelector(
  COMMUNITY_WORKSPACE,
  CURRENT_WORKSPACE_OWNER,
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
  SELECTED_SERVICE_NAME,
  (userWorkspace, serviceName) =>
    userWorkspace && serviceName
      ? userWorkspace[serviceName]
      : undefined,
);

export const ALL_WORKSPACES_FOR_SELECTED_SERVICE = createSelector(
  COMMUNITY_WORKSPACE,
  SELECTED_SERVICE_NAME,
  (workspace, selectedServiceName) =>
    getAllWorkspacesForService(workspace, selectedServiceName),
);
export const SELECTED_WORK_SPACE_OWNER = (state: StoreState) =>
  state.Reducer.currentWorkSpaceOwner;

export const WORKSPACE_OWNER = createSelector(
  APPLICATION_WORKSPACE,
  (appworkspace) => appworkspace?.createdBy,
);

export const ALL_WORKSPACES_FOR_SELECTED_SERVICE_EXCEPT_ACTIVE =
  createSelector(
    COMMUNITY_WORKSPACE,
    SELECTED_SERVICE_NAME,
    WORKSPACE_OWNER,
    (communityWorkspace, selectedServiceName, owner) =>
      getAllWorkspacesForService(
        communityWorkspace,
        selectedServiceName,
      )?.filter(
        (workspace: ApplicationWorkspace) =>
          workspace.createdBy !== owner,
      ),
  );

export const VISITORS = createSelector(
  APPLICATION_WORKSPACE,
  (workspace) => workspace?.visitors,
);

export const VISITORS_EXCEPT_USER = createSelector(
  VISITORS,
  USER,
  (visitors, user) =>
    visitors?.filter(
      (visitor) =>
        user?.profile.preferred_username !== visitor.username,
    ),
);

export const ROLE_IN_CURRENT_WORKSPACE = createSelector(
  APPLICATION_WORKSPACE,
  USER,
  (appWorkspace, user) =>
    getUserRoleInWorkspace(
      appWorkspace,
      user?.profile?.preferred_username,
    ),
);

export const USER_IS_OWNER_IN_CURRENT_WORKSPACE = createSelector(
  CURRENT_WORKSPACE_OWNER,
  USER,
  (owner, user) => owner === user?.profile.preferred_username,
);

export const HTTP_CALL_IS_LOADING = (state: StoreState) =>
  state.Reducer?.currentNumberOfHttpCalls > 0;

// export const SUCCESS_MODEL = (state: StoreState) =>
//   parseModel(state.Reducer.successModelXML);
export const IS_MEMBER_OF_SELECTED_GROUP = createSelector(
  SELECTED_GROUP,
  USER,
  (group, user) => !!user && group?.member,
);

const _SUCCESS_MODEL = (state: StoreState) =>
  state.Reducer?.successModel;

export const SUCCESS_MODEL = createSelector(
  EDIT_MODE,
  _SUCCESS_MODEL,
  APPLICATION_WORKSPACE,
  (editMode, successModel, applicationWorkspace) =>
    applicationWorkspace && editMode
      ? applicationWorkspace.model
      : successModel,
);

export const DIMENSIONS_IN_MODEL = createSelector(
  SUCCESS_MODEL,
  (model) =>
    model?.dimensions ? Object.values(model.dimensions) : undefined,
);

export const RESTRICTED_MODE = (state: StoreState) =>
  state.Reducer?.restricted;

export const SUCCESS_MODEL_XML = (state: StoreState) =>
  state.Reducer.successModel
    ? SuccessModel.fromPlainObject(
        state.Reducer.successModel,
      )?.toXml()?.outerHTML
    : undefined;

export const WORKSPACE_MODEL = createSelector(
  APPLICATION_WORKSPACE,
  (workspace) => workspace?.model,
);

export const WORKSPACE_MODEL_XML = createSelector(
  WORKSPACE_MODEL,
  (model) =>
    model
      ? SuccessModel.fromPlainObject(model)?.toXml()?.outerHTML
      : undefined,
);

const _MEASURE_CATALOG = (state: StoreState) =>
  state.Reducer?.measureCatalog;

export const MEASURE_CATALOG = createSelector(
  EDIT_MODE,
  _MEASURE_CATALOG,
  APPLICATION_WORKSPACE,
  (editMode, measureCatalog, applicationWorkspace) =>
    applicationWorkspace && editMode
      ? applicationWorkspace.catalog
      : measureCatalog,
);

export const MEASURES = createSelector(
  MEASURE_CATALOG,
  (catalog) => catalog?.measures,
);

export const MEASURE = createSelector(
  MEASURES,
  (measures: MeasureMap, measureName: string) =>
    measures ? measures[measureName] : undefined,
);

export const MEASURE_CATALOG_XML = (state: StoreState) =>
  state.Reducer.measureCatalog
    ? MeasureCatalog.fromPlainObject(
        state.Reducer.measureCatalog,
      )?.toXml()?.outerHTML
    : undefined;

export const WORKSPACE_CATALOG = createSelector(
  APPLICATION_WORKSPACE,
  (workspace) => workspace?.catalog,
);

export const WORKSPACE_CATALOG_XML = createSelector(
  WORKSPACE_CATALOG,
  (catalog) =>
    catalog
      ? MeasureCatalog.fromPlainObject(catalog)?.toXml()?.outerHTML
      : undefined,
);

export const VISUALIZATION_DATA_FOR_QUERY = (
  state: StoreState,
  queryString: string,
) =>
  state.Reducer?.visualizationData &&
  state.Reducer.visualizationData[queryString]
    ? state.Reducer.visualizationData[queryString]
    : undefined;

const _SELECTED_SERVICE = (state: StoreState) =>
  state.Reducer?.services && state.Reducer.selectedServiceName
    ? state.Reducer.services[state.Reducer.selectedServiceName]
    : undefined;

export const ASSETS_LOADED = createSelector(
  SUCCESS_MODEL,
  MEASURE_CATALOG,

  (model, catalog) => !!model && !!catalog,
);

export const SELECTED_SERVICE = createSelector(
  _SELECTED_SERVICE,
  EDIT_MODE,
  APPLICATION_WORKSPACE,
  (service, editMode, workspace) =>
    editMode && workspace ? workspace?.service : service,
);

export const USER_HAS_EDIT_RIGHTS = createSelector(
  EDIT_MODE,
  ROLE_IN_CURRENT_WORKSPACE,
  (editMode, role) =>
    editMode && (role === 'owner' || role === 'editor'),
);
function parseXml(xml: string) {
  const parser = new DOMParser();
  return parser.parseFromString(xml, 'text/xml');
}

function parseCatalog(xml: string): MeasureCatalog {
  const doc = parseXml(xml);
  try {
    return MeasureCatalog.fromXml(doc.documentElement);
  } catch (e) {
    this.logger.warn(e);
  }
}

function parseModel(xml: string): SuccessModel {
  const doc = parseXml(xml);
  try {
    return SuccessModel.fromXml(doc.documentElement);
  } catch (e) {
    this.logger.warn(e);
  }
}
/**
 * filter groups that the user is a part of
 * @param groups groups as a collection
 */
function _userGroups(groups: GroupCollection) {
  if (!groups) {
    return undefined;
  }
  const userGroups = [];
  if (!groups) {
    return [];
  }
  for (const groupId of Object.keys(groups)) {
    if (groups[groupId].member) {
      userGroups.push(groups[groupId]);
    }
  }
  return userGroups;
}

function _foreignGroups(groups: GroupCollection) {
  if (!groups) {
    return undefined;
  }
  const userGroups = [];
  if (!groups) {
    return [];
  }
  for (const groupId of Object.keys(groups)) {
    if (!groups[groupId].member) {
      userGroups.push(groups[groupId]);
    }
  }
  return userGroups;
}
function sortGroupsByName(
  a: GroupInformation,
  b: GroupInformation,
): number {
  if (a.name.toLocaleLowerCase() < b.name.toLocaleLowerCase()) {
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
    if (a.alias.toLocaleLowerCase() < b.alias.toLocaleLowerCase())
      return -1;
    else return 1;
  } else {
    if (a.name.toLocaleLowerCase() < b.name.toLocaleLowerCase())
      return -1;
    else return 1;
  }
}

function getUserRoleInWorkspace(
  applicationWorkspace: ApplicationWorkspace,
  userName: string,
): string {
  if (!userName || !applicationWorkspace) {
    return;
  }
  if (applicationWorkspace.createdBy === userName) {
    return 'owner';
  }
  const visitors = applicationWorkspace.visitors || [];
  const visitorSearchResult = visitors?.find(
    (visitor) => visitor.username === userName,
  );
  if (visitorSearchResult) {
    return visitorSearchResult.role;
  }
  return 'spectator';
}

function getAllWorkspacesForService(
  workspace: CommunityWorkspace,
  serviceName: string,
): ApplicationWorkspace[] {
  if (!workspace) {
    return;
  }
  const result = [];
  if (!serviceName) {
    return [];
  }
  const userWorkspaces = Object.values(workspace);
  for (const userWorkspace of userWorkspaces) {
    if (Object.keys(userWorkspace).includes(serviceName)) {
      result.push(userWorkspace[serviceName] as ApplicationWorkspace);
    }
  }
  return result as ApplicationWorkspace[];
}

/**
 * Get the workspace for the current workspace.
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
  if (!communityWorkspace) return;
  if (owner && communityWorkspace[owner])
    return communityWorkspace[owner];
  return communityWorkspace[user];
}
