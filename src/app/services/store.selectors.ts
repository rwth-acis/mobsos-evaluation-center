import { createSelector } from '@ngrx/store';
import { GroupCollection } from '../models/community.model';
import { MeasureCatalog } from '../models/measure.catalog';
import { StoreState } from '../models/state.model';
import { SuccessModel } from '../models/success.model';

export const SERVICES = (state: StoreState) =>
  Object.values(state.Reducer.services);

export const GROUPS = (state: StoreState) =>
  Object.values(state.Reducer.groups);

export const SELECTED_SERVICE = (state: StoreState) =>
  state.Reducer.selectedService;

export const SELECTED_GROUP = (state: StoreState) =>
  state.Reducer.selectedGroup;

export const USER_GROUPS = (state: StoreState) =>
  _filterGroups(state.Reducer.groups);

export const SELECTED_SERVICE_NAME = (state: StoreState) =>
  state.Reducer.selectedServiceName;

export const SELECTED_GROUP_ID = (state: StoreState) =>
  state.Reducer.selectedGroupId;

export const HTTP_CALL_IS_LOADING = (state: StoreState) =>
  state.Reducer.currentNumberOfHttpCalls > 0;

export const SUCCESS_MODEL = (state: StoreState) =>
  parseModel(state.Reducer.successModelXML);

export const MEASURE_CATALOG = (state: StoreState) =>
  parseCatalog(state.Reducer.measureCatalogXML);
// export const TagOptions = createSelector(AllTags, ActiveTags, (all, selected) => selectRemaining(all, selected));

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
}
