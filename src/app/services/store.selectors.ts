import { createSelector } from '@ngrx/store';
import { MeasureCatalog } from '../models/measure.catalog';
import { AppState } from '../models/state.model';
import { SuccessModel } from '../models/success.model';

export const SELECTED_SERVICE_NAME = (state: AppState) =>
  state.selectedServiceName;

export const SELECTED_GROUP_ID = (state: AppState) => state.selectedGroupId;

export const SUCCESS_MODEL = (state: AppState) =>
  parseModel(state.successModelXML);

export const MEASURE_CATALOG = (state: AppState) =>
  parseCatalog(state.measureCatalogXML);
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
