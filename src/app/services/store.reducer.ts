import { createReducer, on } from '@ngrx/store';
import { AppState } from '../models/state.model';
import { ServiceCollection } from '../store.service';
import { find, isEmpty, throttle } from 'lodash-es';
import * as Actions from './store.actions';

export const initialState: AppState = {
  services: undefined,
  groups: undefined,
  user: undefined,
  selectedGroup: undefined,
  selectedService: undefined,
  editMode: false,
  questionnaires: undefined,
  messageDescriptions: undefined,
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
  )
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
