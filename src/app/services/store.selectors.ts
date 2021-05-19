import { createSelector } from '@ngrx/store';
import { GroupCollection } from '../models/community.model';
import { MeasureCatalog } from '../models/measure.catalog';
import { StoreState } from '../models/state.model';
import { SuccessModel } from '../models/success.model';

//all of these should be used to get data from the store. Example: this.ngrxStore.select(SERVICES).subscribe((services)=>{...})

export const SERVICES = (state: StoreState) =>
  Object.values(state.Reducer.services);

export const MEASURE = (state: StoreState, name: string) =>
  state.Reducer.measureCatalog.measures[name];

export const GROUPS = (state: StoreState) =>
  Object.values(state.Reducer.groups);

export const VISUALIZATION_DATA = (state: StoreState) =>
  state.Reducer.visualizationData;

export const WORKSPACE_INITIALIZED = (state: StoreState) =>
  state.Reducer.successModelInitialized &&
  state.Reducer.measureCatalogInitialized;

export const VISUALIZATION_DATA_FOR_QUERY = (
  state: StoreState,
  queryString: string
) =>
  state.Reducer.visualizationData &&
  state.Reducer.visualizationData[queryString]
    ? state.Reducer.visualizationData[queryString]
    : undefined;

export const SELECTED_SERVICE = (state: StoreState) =>
  state.Reducer.selectedService;

export const SELECTED_GROUP = (state: StoreState) =>
  state.Reducer.selectedGroup;

export const EDIT_MODE = (state: StoreState) => state.Reducer.editMode;

export const USER_GROUPS = (state: StoreState) =>
  _filterGroups(state.Reducer.groups);

export const USER = (state: StoreState) => state.Reducer.user;

export const SELECTED_SERVICE_NAME = (state: StoreState) =>
  state.Reducer.selectedServiceName;

export const SELECTED_GROUP_ID = (state: StoreState) =>
  state.Reducer.selectedGroup.id;

export const HTTP_CALL_IS_LOADING = (state: StoreState) =>
  state.Reducer.currentNumberOfHttpCalls > 0;

// export const SUCCESS_MODEL = (state: StoreState) =>
//   parseModel(state.Reducer.successModelXML);

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
function _filterGroups(groups: GroupCollection) {
  let userGroups = [];
  for (const groupId of Object.keys(groups)) {
    if (groups[groupId].member) {
      userGroups.push(groups[groupId]);
    }
  }
  return userGroups;
}
