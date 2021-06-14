import { createReducer, on } from '@ngrx/store';
import {
  MeasureCatalog,
  MeasureMap,
} from '../models/measure.catalog';
import { Measure } from '../models/measure.model';
import { AppState, INITIAL_STATE } from '../models/state.model';
import {
  DimensionMap,
  SuccessFactor,
  SuccessModel,
} from '../models/success.model';
import { VisualizationData } from '../models/visualization.model';
import {
  ApplicationWorkspace,
  CommunityWorkspace,
} from '../models/workspace.model';
import * as Actions from './store.actions';
import { cloneDeep } from 'lodash';
import { UserRole, Visitor } from '../models/user.model';

export const initialState: AppState = INITIAL_STATE;

const _Reducer = createReducer(
  initialState,
  on(
    Actions.storeServices,
    (state, { servicesFromL2P, servicesFromMobSOS }) => ({
      ...state,
      services: mergeServiceData(
        { ...state.services },
        servicesFromL2P,
        { ...state.messageDescriptions },
        servicesFromMobSOS,
      ),
    }),
  ),
  on(
    Actions.storeGroups,
    (state, { groupsFromContactService, groupsFromMobSOS }) => ({
      ...state,
      groups: mergeGroupData(
        { ...state.groups },
        groupsFromContactService,
        groupsFromMobSOS,
      ),
    }),
  ),
  on(Actions.setGroup, (state, { groupId }) =>
    groupId
      ? {
          ...state,
          selectedGroupId: groupId,
          measureCatalogInitialized: false,
        }
      : state,
  ),
  on(Actions.setService, (state, { service }) =>
    service
      ? {
          ...state,
          selectedServiceName: service?.name,
          successModelInitialized: false,
        }
      : state,
  ),
  on(Actions.toggleEdit, (state) => ({
    ...state,
    editMode: !state.editMode,
  })),
  on(Actions.enableEdit, (state) => ({
    ...state,
    editMode: true,
  })),
  on(Actions.disableEdit, (state) => ({
    ...state,
    editMode: false,
  })),
  on(Actions.toggleExpertMode, (state) => ({
    ...state,
    expertMode: !state.expertMode,
  })),
  on(Actions.storeUser, (state, { user }) => ({
    ...state,
    user: { ...user, signedIn: !!user },
  })),
  on(Actions.storeCatalog, (state, { xml }) => ({
    ...state,
    measureCatalog: xml ? parseCatalog(xml) : new MeasureCatalog({}),
    measureCatalogInitialized: true,
  })),
  on(Actions.fetchSuccessModel, (state) => ({
    ...state,
    successModelInitialized: false,
  })),
  on(Actions.fetchMeasureCatalog, (state) => ({
    ...state,
    measureCatalogInitialized: false,
  })),
  on(Actions.storeSuccessModel, (state, { xml }) => ({
    ...state,
    successModelInitialized: true,
    successModel:
      xml === null
        ? SuccessModel.emptySuccessModel(getSelectedService(state))
        : parseModel(xml),
  })),

  on(Actions.incrementLoading, (state) => ({
    ...state,
    currentNumberOfHttpCalls: state.currentNumberOfHttpCalls + 1,
  })),
  on(Actions.decrementLoading, (state) => ({
    ...state,
    currentNumberOfHttpCalls: state.currentNumberOfHttpCalls - 1,
  })),
  on(Actions.updateCommunityWorkspace, (state, { workspace }) => ({
    ...state,
    communityWorkspace: workspace,
  })),
  on(Actions.addFactorToDimension, (state, props) => ({
    ...state,
    successModel: addFactorToDimension(
      props.factor,
      props.dimensionName,
      state.successModel,
    ),
  })),
  on(Actions.removeFactor, (state, props) => ({
    ...state,
    successModel: removeFactor(state.successModel, props.name),
  })),
  on(Actions.removeMeasure, (state, props) => ({
    ...state,
    successModel: removeMeasure(state.successModel, props.name),
  })),
  on(Actions.setWorkSpaceOwner, (state, props) => ({
    ...state,
    currentWorkSpaceOwner: props.username,
    communityWorkspace: addVisitor(
      state.communityWorkspace,
      props.username,
      state.currentWorkSpaceOwner,
      state.selectedServiceName,
    ),
  })),
  on(Actions.editFactorInDimension, (state, props) => ({
    ...state,
    successModel: editFactorInDimension(
      props.factor,
      props.oldFactorName,
      props.dimensionName,
      state.successModel,
    ),
  })),
  on(Actions.addMeasureToCatalog, (state, props) => ({
    ...state,
    measureCatalog: {
      ...state.measureCatalog,
      measures: addMeasureToMeasures(
        state.measureCatalog.measures,
        props.measure,
      ),
    } as MeasureCatalog,
  })),
  on(Actions.editMeasure, (state, props) => ({
    ...state,
    measureCatalog: {
      ...state.measureCatalog,
      measures: updateMeasureInCatalog(
        state.measureCatalog.measures,
        props.measure,
        props.oldMeasureName,
      ),
    } as MeasureCatalog,
    successModel: {
      ...state.successModel,
      dimensions: updateMeasureInSuccessModel(
        state.successModel.dimensions,
        props,
      ),
    } as SuccessModel,
  })),
  on(Actions.addMeasureToFactor, (state, props) => ({
    ...state,
    successModel: addMeasureToFactorInModel(
      state.successModel,
      props.dimensionName,
      props.factorName,
      props.measure,
    ),
  })),
  on(Actions.storeVisualizationData, (state, { data, query }) => ({
    ...state,
    visualizationData: data
      ? updateVisualizationData(
          { ...state.visualizationData },
          data,
          query,
        )
      : state.visualizationData,
  })),
);

export function Reducer(state, action) {
  return _Reducer(state, action);
}

function updateVisualizationData(
  currentVisualizationData: VisualizationData,
  data: any[][],
  query: string,
) {
  currentVisualizationData[query] = { data, fetchDate: new Date() };
  return currentVisualizationData;
}

/**
 * Convert data from both service sources into a common format.
 *
 * The format is {<service-name>: {alias: <service-alias>, mobsosIDs: [<mobsos-md5-agent-ids>]}}.
 * Example: {"i5.las2peer.services.mobsos.successModeling.MonitoringDataProvisionService":
 *            {alias: "mobsos-success-modeling", mobsosIDs: ["3c3df6941ac59070c01d45611ce15107"]}}
 */
function mergeServiceData(
  serviceCollection,
  servicesFromL2P,
  messageDescriptions,
  servicesFromMobSOS,
) {
  serviceCollection = { ...serviceCollection };
  if (servicesFromL2P) {
    for (const service of servicesFromL2P) {
      if (service) {
        // use most recent release and extract the human readable name
        let releases;
        let latestRelease;
        if (service?.releases?.length > 0) {
          releases = Object.keys(service.releases).sort();
          latestRelease = service.releases[releases.slice(-1)[0]];
        }

        let serviceIdentifier = service?.name + '.';
        if (!serviceIdentifier) continue;
        if (!latestRelease?.supplement?.class) continue;
        serviceIdentifier += latestRelease?.supplement?.class;

        serviceCollection[serviceIdentifier] = {
          name: serviceIdentifier,
          alias: latestRelease?.supplement?.name,
          mobsosIDs: [],
          serviceMessageDescriptions: getMessageDescriptionForService(
            messageDescriptions,
            serviceIdentifier,
          ),
        };
      }
    }
  }

  if (servicesFromMobSOS) {
    for (const serviceAgentID of Object.keys(servicesFromMobSOS)) {
      const tmp = servicesFromMobSOS[
        serviceAgentID
      ]?.serviceName?.split('@', 2);
      if (!(tmp?.length > 0)) continue;
      const serviceName = tmp[0];
      let serviceAlias =
        servicesFromMobSOS[serviceAgentID]?.serviceAlias;
      const registrationTime =
        servicesFromMobSOS[serviceAgentID]?.registrationTime;
      if (!serviceAlias) {
        serviceAlias = serviceName;
      }

      // only add mobsos service data if the data from the discovery is missing
      const serviceMessageDescriptions =
        getMessageDescriptionForService(
          messageDescriptions,
          serviceName,
        );
      if (!(serviceName in serviceCollection)) {
        serviceCollection[serviceName] = {
          name: serviceName,
          alias: serviceAlias,
          mobsosIDs: [],
          serviceMessageDescriptions,
        };
      }
      if (!serviceCollection[serviceName]) continue;
      const mobsosIDs = [...serviceCollection[serviceName].mobsosIDs];
      mobsosIDs.push({
        agentID: serviceAgentID,
        registrationTime,
      });
      mobsosIDs.sort(
        (a, b) => a.registrationTime - b.registrationTime,
      );
      serviceCollection[serviceName] = {
        ...serviceCollection[serviceName],
        serviceMessageDescriptions: { ...serviceMessageDescriptions },
      };
    }
  }
  return serviceCollection;
}

function getMessageDescriptionForService(
  messageDescriptions,
  serviceIdentifier: string,
) {
  let serviceMessageDescriptions = {};
  if (messageDescriptions && messageDescriptions[serviceIdentifier])
    serviceMessageDescriptions =
      messageDescriptions[serviceIdentifier];

  return serviceMessageDescriptions;
}

/**
 * Convert data from both group sources into a common format.
 *
 * The format is {<group-ID>: {name: <group-name>, member: (true|false)}}.
 * Example: {"ba1f0b36c32fc90cc3f47db27282ad3dc8b75812ad2d08cf82805c9077567a72d9e3815fc33d7223338dc4f429f89eb3aac0
 *              710b5aec7334821be0a5e84e8daa": {"name": "MyGroup", "member": false}}
 */
function mergeGroupData(
  groups,
  groupsFromContactService,
  groupsFromMobSOS,
) {
  // mark all these groups as groups the current user is a member of
  if (groupsFromContactService) {
    for (const groupID of Object.keys(groupsFromContactService)) {
      const groupName = groupsFromContactService[groupID];
      groups[groupID] = {
        id: groupID,
        name: groupName,
        member: true,
      };
    }
    // we are going to merge the groups obtained from MobSOS into the previously acquired object
  }
  if (!groupsFromMobSOS) return groups;
  for (const group of groupsFromMobSOS) {
    const groupID = group.groupID;
    const groupName = group.name;
    const member = group.isMember;
    if (
      !groupsFromContactService ||
      !(groupID in groupsFromContactService)
    ) {
      groups[groupID] = { id: groupID, name: groupName, member };
    }
  }

  return groups;
}

function parseXml(xml: string) {
  const parser = new DOMParser();
  return parser.parseFromString(xml, 'text/xml');
}

function parseCatalog(xml: string): MeasureCatalog {
  if (!xml) {
    return;
  }
  const doc = parseXml(xml);
  try {
    return MeasureCatalog.fromXml(doc.documentElement);
  } catch (e) {
    console.error(e);
  }
}

function parseModel(xml: string): SuccessModel {
  if (!xml) {
    return;
  }
  const doc = parseXml(xml);
  try {
    return SuccessModel.fromXml(doc.documentElement);
  } catch (e) {
    this.logger.warn(e);
  }
}
function addFactorToDimension(
  factor: SuccessFactor,
  dimensionName: string,
  successModel: SuccessModel,
) {
  if (!successModel) return;
  const copy = { ...successModel.dimensions };
  let factorsList = copy[dimensionName];
  if (!factorsList) factorsList = [];
  factorsList = [...factorsList];
  factorsList.unshift(factor);
  copy[dimensionName] = factorsList;

  return { ...successModel, dimensions: copy } as SuccessModel;
}

function removeFactor(
  successModel: SuccessModel,
  factorName: string,
) {
  if (!successModel) return;
  const copy = { ...successModel.dimensions };
  for (const [dimensionName, dimension] of Object.entries(copy)) {
    copy[dimensionName] = dimension.filter(
      (factor) => factor.name !== factorName,
    );
  }
  return { ...successModel, dimensions: copy } as SuccessModel;
}

function removeMeasure(
  successModel: SuccessModel,
  measureName: string,
) {
  if (!successModel) return;
  const copy = { ...successModel.dimensions };
  for (const [dimensionName, dimension] of Object.entries(copy)) {
    const factorsCopy = [];
    for (const factor of dimension) {
      factorsCopy.push({
        ...factor,
        measures: factor.measures.filter(
          (measure) => measure !== measureName,
        ),
      });
    }
    copy[dimensionName] = factorsCopy;
  }

  return { ...successModel, dimensions: copy } as SuccessModel;
}
function editFactorInDimension(
  factor: SuccessFactor,
  oldFactorName: string,
  dimensionName: string,
  successModel: SuccessModel,
) {
  if (!successModel) return;
  const copy = { ...successModel.dimensions };
  let factorsList = copy[dimensionName];
  if (!factorsList) return successModel;
  factorsList = [...factorsList];
  for (let i = 0; i < factorsList.length; i++) {
    const f = factorsList[i];
    if (f.name === oldFactorName) {
      factorsList[i] = factor;
    }
  }
  copy[dimensionName] = factorsList;
  return { ...successModel, dimensions: copy } as SuccessModel;
}

function addMeasureToMeasures(
  measureMap: MeasureMap,
  measure: Measure,
) {
  const copy = { ...measureMap } as MeasureMap;
  copy[measure.name] = measure;
  return copy;
}

function addMeasureToFactorInModel(
  successModel: SuccessModel,
  dimensionName: string,
  factorName: string,
  measure: Measure,
) {
  if (!dimensionName) return successModel;
  const dimensions = { ...successModel.dimensions };
  const factorsForDimension = [
    ...dimensions[dimensionName],
  ] as SuccessFactor[];
  const factorList = factorsForDimension.filter(
    (factor) => factor.name === factorName,
  );
  const copyFactorList = [];
  for (let factor of factorList) {
    factor = {
      ...factor,
      measures: [...factor.measures],
    } as SuccessFactor;
    factor.measures.unshift(measure.name);
    copyFactorList.push(factor);
  }

  dimensions[dimensionName] = copyFactorList;
  return { ...successModel, dimensions } as SuccessModel;
}

function updateMeasureInCatalog(
  measures: MeasureMap,
  measure: Measure,
  oldMeasureName: string,
) {
  const copy = { ...measures };
  copy[oldMeasureName] = measure;
  return copy;
}

function updateMeasureInSuccessModel(
  dimensions: DimensionMap,
  props: {
    measure: Measure;
    oldMeasureName: string;
    factorName: string;
    dimensionName: string;
  },
) {
  const copyDimensions = { ...dimensions };
  let copyFactors = [...copyDimensions[props.dimensionName]];
  copyFactors = copyFactors.map((factor) =>
    factor.name === props.factorName
      ? updateMeasureInFactor(
          factor,
          props.measure,
          props.oldMeasureName,
        )
      : factor,
  );
  copyDimensions[props.dimensionName] = copyFactors;
  return copyDimensions;
}

function updateMeasureInFactor(
  factor: SuccessFactor,
  measure: Measure,
  oldMeasureName: string,
) {
  const copy = [...factor.measures];
  return copy.map((m) =>
    measure.name === oldMeasureName ? measure : m,
  );
}

function getSelectedService(state: AppState) {
  if (!state.services || !state.selectedServiceName) return undefined;
  return state.services[state.selectedServiceName];
}
function addVisitor(
  communityWorkspace: CommunityWorkspace,
  username: string,
  owner: string,
  serviceName: string,
): CommunityWorkspace {
  const copy = cloneDeep(communityWorkspace); // copy workspace first
  const userWorkspace = copy[owner];
  if (!userWorkspace) return communityWorkspace;
  const appWorkspace: ApplicationWorkspace =
    userWorkspace[serviceName];
  if (!appWorkspace) return communityWorkspace;
  appWorkspace.visitors.push(
    new Visitor(username, UserRole.SPECTATOR),
  );
  return copy;
}
