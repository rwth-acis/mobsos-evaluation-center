import { createReducer, on } from '@ngrx/store';
import { AppState } from '../models/state.model';
import { VData, VisualizationData } from '../models/visualization.model';
import * as Actions from './store.actions';

export const initialState: AppState = {
  services: {},
  groups: {},
  user: undefined,
  selectedGroup: undefined,
  selectedGroupId: undefined,
  selectedService: undefined,
  selectedServiceName: undefined,
  editMode: false,
  questionnaires: [],
  messageDescriptions: undefined,
  visualizationData: undefined,
  measureCatalogXML: undefined,
  successModelXML: undefined,
  currentNumberOfHttpCalls: 0,
  expertMode: false,
  successModelInitialized: false,
  measureCatalogInitialized: false,
};

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
        servicesFromMobSOS
      ),
    })
  ),
  on(
    Actions.storeGroups,
    (state, { groupsFromContactService, groupsFromMobSOS }) => ({
      ...state,
      groups: mergeGroupData(
        { ...state.groups },
        groupsFromContactService,
        groupsFromMobSOS
      ),
    })
  ),
  on(Actions.setGroup, (state, { groupId }) =>
    groupId
      ? {
          ...state,
          selectedGroup: state.groups[groupId],
          selectedGroupId: groupId,
        }
      : state
  ),
  on(Actions.setService, (state, { service }) =>
    service
      ? {
          ...state,
          selectedService: service,
          selectedServiceName: service?.name,
        }
      : state
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
    user: user,
  })),
  on(Actions.storeCatalogXML, (state, { xml }) => ({
    ...state,
    measureCatalogXML: xml,
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
  on(Actions.storeSuccessModelXML, (state, { xml }) => ({
    ...state,
    successModelXML: xml,
    successModelInitialized: true,
  })),
  on(Actions.incrementLoading, (state) => ({
    ...state,
    currentNumberOfHttpCalls: state.currentNumberOfHttpCalls + 1,
  })),
  on(Actions.decrementLoading, (state) => ({
    ...state,
    currentNumberOfHttpCalls: state.currentNumberOfHttpCalls - 1,
  })),
  on(Actions.storeVisualizationData, (state, { data, query }) => ({
    ...state,
    visualizationData: updateVisualizationData(
      { ...state.visualizationData },
      data,
      query
    ),
  }))
);

export function Reducer(state, action) {
  return _Reducer(state, action);
}

function updateVisualizationData(
  currentVisualizationData: VisualizationData,
  data: VData,
  query: string
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
  servicesFromMobSOS
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
            serviceIdentifier
          ),
        };
      }
    }
  }

  if (servicesFromMobSOS) {
    for (const serviceAgentID of Object.keys(servicesFromMobSOS)) {
      let tmp = servicesFromMobSOS[serviceAgentID]?.serviceName?.split('@', 2);
      if (!(tmp?.length > 0)) continue;
      const serviceName = tmp[0];
      let serviceAlias = servicesFromMobSOS[serviceAgentID]?.serviceAlias;
      const registrationTime =
        servicesFromMobSOS[serviceAgentID]?.registrationTime;
      if (!serviceAlias) {
        serviceAlias = serviceName;
      }

      // only add mobsos service data if the data from the discovery is missing
      const serviceMessageDescriptions = getMessageDescriptionForService(
        messageDescriptions,
        serviceName
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
      let mobsosIDs = [...serviceCollection[serviceName].mobsosIDs];
      mobsosIDs.push({
        agentID: serviceAgentID,
        registrationTime,
      });
      mobsosIDs.sort((a, b) => a.registrationTime - b.registrationTime);
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
  serviceIdentifier: string
) {
  let serviceMessageDescriptions = {};
  if (messageDescriptions && messageDescriptions[serviceIdentifier])
    serviceMessageDescriptions = messageDescriptions[serviceIdentifier];

  return serviceMessageDescriptions;
}

/**
 * Convert data from both group sources into a common format.
 *
 * The format is {<group-ID>: {name: <group-name>, member: (true|false)}}.
 * Example: {"ba1f0b36c32fc90cc3f47db27282ad3dc8b75812ad2d08cf82805c9077567a72d9e3815fc33d7223338dc4f429f89eb3aac0
 *              710b5aec7334821be0a5e84e8daa": {"name": "MyGroup", "member": false}}
 */
function mergeGroupData(groups, groupsFromContactService, groupsFromMobSOS) {
  // mark all these groups as groups the current user is a member of
  if (groupsFromContactService) {
    for (const groupID of Object.keys(groupsFromContactService)) {
      const groupName = groupsFromContactService[groupID];
      groups[groupID] = { id: groupID, name: groupName, member: true };
    }
    // we are going to merge the groups obtained from MobSOS into the previously acquired object
  }
  if (groupsFromMobSOS) {
    for (const group of groupsFromMobSOS) {
      const groupID = group.groupID;
      const groupName = group.name;
      const member = group.isMember;
      if (!(groupID in groups)) {
        groups[groupID] = { id: groupID, name: groupName, member };
      }
    }
  }

  return groups;
}
