import { createSelector } from '@ngrx/store';
import { GroupCollection, GroupInformation } from '../models/community.model';
import { MeasureCatalog } from '../models/measure.catalog';
import { ServiceInformation } from '../models/service.model';
import { StoreState } from '../models/state.model';
import { SuccessModel } from '../models/success.model';
import { User } from '../models/user.model';
import { VisualizationData } from '../models/visualization.model';

//all of these should be used to get data from the store. Example: this.ngrxStore.select(SERVICES).subscribe((services)=>{...})

export const SERVICES = (state: StoreState) =>
  Object.values(state.Reducer.services).sort((a, b) =>
    sortServicesByName(a, b)
  );

export const MEASURE = (state: StoreState, name: string) =>
  state.Reducer.measureCatalog.measures[name];

export const GROUPS = (state: StoreState) =>
  state.Reducer.groups
    ? Object.values(state.Reducer.groups).sort((a, b) => sortGroupsByName(a, b))
    : undefined;

const _GROUPS = (state: StoreState) => state.Reducer.groups;

export const VISUALIZATION_DATA = (state: StoreState) =>
  state.Reducer.visualizationData;

export const WORKSPACE_INITIALIZED = (state: StoreState) =>
  state.Reducer.successModelInitialized &&
  state.Reducer.measureCatalogInitialized;

export const SELECTED_SERVICE = (state: StoreState) =>
  state.Reducer.selectedService;

export const EDIT_MODE = (state: StoreState) => state.Reducer.editMode;

export const EXPERT_MODE = (state: StoreState) => state.Reducer.expertMode;

export const USER_GROUPS = (state: StoreState) =>
  _userGroups(state.Reducer.groups);

export const FOREIGN_GROUPS = (state: StoreState) =>
  _foreignGroups(state.Reducer.groups);

export const USER = (state: StoreState) => state.Reducer.user as User;

export const SELECTED_SERVICE_NAME = (state: StoreState) =>
  state.Reducer.selectedServiceName;

export const SELECTED_GROUP_ID = (state: StoreState) =>
  state.Reducer.selectedGroupId;

export const SELECTED_GROUP = createSelector(
  SELECTED_GROUP_ID,
  _GROUPS,
  (groupId, groups) => (groups ? groups[groupId] : undefined)
);

export const HTTP_CALL_IS_LOADING = (state: StoreState) =>
  state.Reducer.currentNumberOfHttpCalls > 0;

// export const SUCCESS_MODEL = (state: StoreState) =>
//   parseModel(state.Reducer.successModelXML);
export const IS_MEMBER_OF_SELECTED_GROUP = createSelector(
  SELECTED_GROUP,
  USER,
  (group, user) => !!user && group?.member
);

export const SUCCESS_MODEL = (state: StoreState) => state.Reducer.successModel;

export const SUCCESS_MODEL_XML = (state: StoreState) =>
  state.Reducer.successModel
    ? SuccessModel.fromPlainObject(state.Reducer.successModel)?.toXml()
        ?.outerHTML
    : undefined;

export const MEASURE_CATALOG = (state: StoreState) =>
  state.Reducer.measureCatalog;

export const MEASURE_CATALOG_XML = (state: StoreState) =>
  state.Reducer.measureCatalog
    ? MeasureCatalog.fromPlainObject(state.Reducer.measureCatalog)?.toXml()
        ?.outerHTML
    : undefined;

export const VISUALIZATION_DATA_FOR_QUERY = (
  state: StoreState,
  queryString: string
) =>
  state.Reducer.visualizationData &&
  state.Reducer.visualizationData[queryString]?.data
    ? state.Reducer.visualizationData[queryString].data
    : undefined;

function parseXml(xml: string) {
  const parser = new DOMParser();
  return parser.parseFromString(xml, 'text/xml');
}

function parseCatalog(xml: string): MeasureCatalog {
  let doc = parseXml(xml);
  try {
    return MeasureCatalog.fromXml(doc.documentElement);
  } catch (e) {
    this.logger.warn(e);
  }
}

function parseModel(xml: string): SuccessModel {
  let doc = parseXml(xml);
  try {
    return SuccessModel.fromXml(doc.documentElement);
  } catch (e) {
    this.logger.warn(e);
  }
}
/**
 * filter groups that the user is a part of
 * @param groups
 */
function _userGroups(groups: GroupCollection) {
  if (!groups) {
    return undefined;
  }
  let userGroups = [];
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
  let userGroups = [];
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
function sortGroupsByName(a: GroupInformation, b: GroupInformation): number {
  if (a.name < b.name) {
    return -1;
  } else return 1;
}
function sortServicesByName(
  a: ServiceInformation,
  b: ServiceInformation
): number {
  if (a.name < b.name) {
    return -1;
  } else return 1;
}
