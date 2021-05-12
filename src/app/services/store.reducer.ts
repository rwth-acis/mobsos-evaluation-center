import { createReducer, on } from '@ngrx/store';
import { AppState } from '../models/state.model';
import { ServiceCollection } from '../store.service';
import { find, isEmpty, throttle } from 'lodash-es';
import * as Actions from './store.actions';

export const initialState: AppState = {
  services: {},
  groups: {},
  user: undefined,
  selectedGroup: undefined,
  selectedService: undefined,
  editMode: false,
  questionnaires: [],
  messageDescriptions: undefined,
  visualizations: {},
};

const _Reducer = createReducer(
  initialState,
  on(
    Actions.storeServices,
    (state, { servicesFromL2P, servicesFromMobSOS }) => ({
      ...state,
      services: mergeServiceData(
        servicesFromL2P,
        state.messageDescriptions,
        servicesFromMobSOS
      ),
    })
  ),
  on(
    Actions.storeGroups,
    (state, { groupsFromContactService, groupsFromMobSOS }) => ({
      ...state,
      groups: mergeGroupData(groupsFromContactService, groupsFromMobSOS),
    })
  ),
  on(Actions.setGroup, (state, { groupId }) => ({
    ...state,
    selectedGroup: state.groups[groupId],
  })),
  on(Actions.toggleEdit, (state) => ({
    ...state,
    editMode: !state.editMode,
  }))
);

export function Reducer(state, action) {
  return _Reducer(state, action);
}

/**
 * Convert data from both service sources into a common format.
 *
 * The format is {<service-name>: {alias: <service-alias>, mobsosIDs: [<mobsos-md5-agent-ids>]}}.
 * Example: {"i5.las2peer.services.mobsos.successModeling.MonitoringDataProvisionService":
 *            {alias: "mobsos-success-modeling", mobsosIDs: ["3c3df6941ac59070c01d45611ce15107"]}}
 */
function mergeServiceData(
  servicesFromL2P,
  messageDescriptions,
  servicesFromMobSOS
) {
  const serviceCollection: ServiceCollection = {};

  for (const service of servicesFromL2P) {
    if (!isEmpty(service)) {
      // use most recent release and extract the human readable name
      const releases = Object.keys(service.releases).sort();
      const latestRelease = service.releases[releases.slice(-1)[0]];
      const serviceIdentifier =
        service.name + '.' + latestRelease?.supplement?.class;

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

  for (const serviceAgentID of Object.keys(servicesFromMobSOS)) {
    if (!isEmpty(serviceAgentID)) {
      const serviceName = servicesFromMobSOS[serviceAgentID].serviceName.split(
        '@',
        2
      )[0];
      let serviceAlias = servicesFromMobSOS[serviceAgentID].serviceAlias;
      const registrationTime =
        servicesFromMobSOS[serviceAgentID].registrationTime;
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
      serviceCollection[serviceName].mobsosIDs.push({
        agentID: serviceAgentID,
        registrationTime,
      });
      serviceCollection[serviceName].mobsosIDs.sort(
        (a, b) => a.registrationTime - b.registrationTime
      );
      serviceCollection[serviceName].serviceMessageDescriptions =
        serviceMessageDescriptions;
    }
  }
  return serviceCollection;
}

function getMessageDescriptionForService(
  messageDescriptions,
  serviceIdentifier: string
) {
  let serviceMessageDescriptions = {};
  if (messageDescriptions)
    serviceMessageDescriptions = messageDescriptions[serviceIdentifier]
      ? messageDescriptions[serviceIdentifier]
      : {};
  return serviceMessageDescriptions;
}

/**
 * Convert data from both group sources into a common format.
 *
 * The format is {<group-ID>: {name: <group-name>, member: (true|false)}}.
 * Example: {"ba1f0b36c32fc90cc3f47db27282ad3dc8b75812ad2d08cf82805c9077567a72d9e3815fc33d7223338dc4f429f89eb3aac0
 *              710b5aec7334821be0a5e84e8daa": {"name": "MyGroup", "member": false}}
 */
function mergeGroupData(groupsFromContactService, groupsFromMobSOS) {
  const groups = {};

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
