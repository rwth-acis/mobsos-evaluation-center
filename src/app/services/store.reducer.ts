/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Action, createReducer, on } from '@ngrx/store';
import { MeasureCatalog } from '../models/measure.catalog';
import { Measure } from '../models/measure.model';
import { AppState, INITIAL_APP_STATE } from '../models/state.model';
import { SuccessFactor, SuccessModel } from '../models/success.model';
import { VisualizationCollection } from '../models/visualization.model';
import { CommunityWorkspace } from '../models/workspace.model';
import * as Actions from './store.actions';
import { cloneDeep } from 'lodash-es';
import { HttpErrorResponse } from '@angular/common/http';
import { ReqbazProject, Requirement } from '../models/reqbaz.model';
import {
  GroupCollection,
  GroupInformation,
} from '../models/community.model';
import { ServiceCollection } from '../models/service.model';
import { Questionnaire } from '../models/questionnaire.model';

export const initialState: AppState = INITIAL_APP_STATE;

const _Reducer = createReducer(
  initialState,
  on(
    Actions.storeServices,
    (state, { servicesFromL2P, servicesFromMobSOS }) => ({
      ...state,
      services: mergeServiceData(
        state.services,
        servicesFromL2P,
        servicesFromMobSOS,
      ),
    }),
  ),
  on(Actions.storeGroups, (state, { groupsFromContactService }) => ({
    ...state,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    groups: mergeGroupData(
      state.groups || null,
      groupsFromContactService,
    ),
  })),

  on(Actions.resetSuccessModel, (state) => ({
    ...state,
    successModel: initialState.successModel,
  })),

  on(
    Actions.storeMessageDescriptions,
    (state, { descriptions, serviceName }) => ({
      ...state,
      services: addServiceDescriptions(
        state.services,
        descriptions,
        serviceName,
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
  on(Actions.setNumberOfRequirements, (state, { n }) => ({
    ...state,
    numberOfRequirements: n,
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
  on(Actions.removeVisualizationDataForQuery, (state, { query }) => ({
    ...state,
    visualizationData: removeVisualizationData(
      state.visualizationData,
      query,
    ),
  })),
  on(Actions.fetchMeasureCatalog, (state) => ({
    ...state,
    measureCatalogInitialized: false,
  })),
  on(Actions.addQuestionnaireToModel, (state, { questionnaire }) => ({
    ...state,
    communityWorkspace: addQuestionnaireToSuccessModel(
      state,
      questionnaire,
    ),
  })),
  on(Actions.setUserName, (state, props) => ({
    ...state,
    user: {
      ...state.user,
      profile: {
        ...state.user?.profile,
        preferred_username: props.username,
      },
    },
  })),
  on(Actions.setServiceName, (state, props) => ({
    ...state,
    selectedServiceName: props.serviceName,
  })),

  on(Actions.storeSuccessModel, (state, { xml }) => ({
    ...state,
    successModelInitialized: true,
    successModel:
      xml === null
        ? SuccessModel.emptySuccessModel(getSelectedService(state))
        : parseModel(xml),
  })),
  on(Actions.addReqBazarProject, (state, { project }) => ({
    ...state,
    communityWorkspace: addReqBazarProject(state, project),
    successModel: {
      ...state.successModel,
      reqBazProject: project,
    } as SuccessModel,
  })),
  on(Actions.removeReqBazarProject, (state) => ({
    ...state,
    communityWorkspace: removeReqBazarProject(state),
  })),
  on(Actions.storeRequirements, (state, { requirements }) => ({
    ...state,
    requirements,
    communityWorkspace: updateRequirements(state, requirements),
  })),
  on(Actions.storeGroup, (state, { group }) => ({
    ...state,
    groups: addGroup(group, state.groups),
    selectedGroupId: group.id,
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
  on(Actions.storeQuestionnaires, (state, { questionnaires }) => ({
    ...state,
    questionnaires,
  })),
  on(Actions.setCommunityWorkspace, (state, props) => ({
    ...state,
    communityWorkspace: props.workspace,
  })),
  on(Actions.setCommunityWorkspaceOwner, (state, props) => ({
    ...state,
    currentWorkSpaceOwner: props.owner,
  })),
  on(Actions.storeVisualizationData, (state, props) => ({
    ...state,
    visualizationData: updateVisualizationData(
      state.visualizationData,
      props,
    ),
  })),
  on(Actions.editFactorInDimension, (state, props) => ({
    ...state,
    communityWorkspace: editFactorInDimension(
      props.factor,
      props.oldFactorName,
      props.dimensionName,
      state.communityWorkspace,
      state.currentWorkSpaceOwner,
      state.selectedServiceName,
    ),
  })),
  on(Actions.addMeasureToCatalog, (state, props) => ({
    ...state,
    communityWorkspace: addMeasureToMeasureCatalog(
      props.measure,
      state.communityWorkspace,
      state.currentWorkSpaceOwner,
      state.selectedServiceName,
    ),
  })),
  on(Actions.removeMeasureFromCatalog, (state, props) => ({
    ...state,
    communityWorkspace: removeMeasureFromCatalog(
      props.name,
      state.communityWorkspace,
      state.currentWorkSpaceOwner,
      state.selectedServiceName,
    ),
  })),
  on(Actions.editMeasure, (state, props) => ({
    ...state,
    communityWorkspace: updateMeasure(
      state.communityWorkspace,
      state.currentWorkSpaceOwner,
      state.selectedServiceName,
      props,
      props.catalogOnly,
    ),
  })),
  on(Actions.editMeasureInCatalog, (state, props) => ({
    ...state,
    communityWorkspace: updateMeasure(
      state.communityWorkspace,
      state.currentWorkSpaceOwner,
      state.selectedServiceName,
      props,
      true,
    ),
  })),
  on(Actions.addMeasureToFactor, (state, props) => ({
    ...state,
    communityWorkspace: addMeasureToFactorInModel(
      state.communityWorkspace,
      state.currentWorkSpaceOwner,
      state.selectedServiceName,
      props,
    ),
  })),
  on(Actions.resetFetchDate, (state, { query }) => ({
    ...state,
    visualizationData: resetFetchDateForQuery(
      state.visualizationData,
      query,
    ),
  })),

  on(Actions.removeMeasureFromModel, (state, { name }) => ({
    ...state,
    communityWorkspace: removeMeasure(
      state.communityWorkspace,
      state.currentWorkSpaceOwner,
      state.selectedServiceName,
      name,
    ),
  })),
  on(Actions.addFactorToDimension, (state, props) => ({
    ...state,
    communityWorkspace: addFactorToDimension(
      state.communityWorkspace,
      state.currentWorkSpaceOwner,
      state.selectedServiceName,
      props,
    ),
  })),
  on(Actions.removeFactor, (state, { name }) => ({
    ...state,
    communityWorkspace: removeFactor(
      state.communityWorkspace,
      state.currentWorkSpaceOwner,
      state.selectedServiceName,
      name,
    ),
  })),
  on(Actions.addModelToWorkSpace, (state, { xml }) => ({
    ...state,
    communityWorkspace: addModelToCurrentWorkSpace(state, xml),
  })),
  on(Actions.addCatalogToWorkspace, (state, { xml }) => ({
    ...state,
    communityWorkspace: addCatalogToCurrentWorkSpace(state, xml),
  })),
);

export function Reducer(state: AppState, action: Action): any {
  return _Reducer(state, action);
}

function addReqBazarProject(state: AppState, project: ReqbazProject) {
  const selectedServiceName = state.selectedServiceName;
  const currentWorkSpaceOwner = state.currentWorkSpaceOwner;
  const workspace = state.communityWorkspace;
  const copy = cloneDeep(workspace) as CommunityWorkspace;
  const appWorkspace = getWorkspaceByUserAndService(
    copy,
    currentWorkSpaceOwner,
    selectedServiceName,
  );
  if (!appWorkspace) {
    return workspace;
  }
  appWorkspace.model.reqBazProject = project;

  copy[currentWorkSpaceOwner][selectedServiceName] = appWorkspace;
  return copy;
}

function removeReqBazarProject(state: AppState) {
  const selectedServiceName = state.selectedServiceName;
  const currentWorkSpaceOwner = state.currentWorkSpaceOwner;
  const workspace = state.communityWorkspace;
  const copy = cloneDeep(workspace) as CommunityWorkspace;
  const appWorkspace = getWorkspaceByUserAndService(
    copy,
    currentWorkSpaceOwner,
    selectedServiceName,
  );
  if (!appWorkspace) {
    return workspace;
  }
  appWorkspace.model.reqBazProject = null;

  copy[currentWorkSpaceOwner][selectedServiceName] = appWorkspace;
  return copy;
}

function updateVisualizationData(
  currentVisualizationData: VisualizationCollection,
  props: {
    data?: any[][];
    query?: string;
    error?: HttpErrorResponse;
  },
) {
  currentVisualizationData = cloneDeep(currentVisualizationData);
  if (!props?.query || props?.error?.status === 0) {
    return currentVisualizationData;
  }
  if (props?.data) {
    // overwrite existing data
    currentVisualizationData[props.query] = {
      data: props.data,
      fetchDate: new Date().toISOString(),
      error: null,
      loading: false,
    };
  } else {
    currentVisualizationData[props.query] = {
      data: currentVisualizationData[props.query]
        ? currentVisualizationData[props.query]?.data
        : null,
      error: props?.error,
      fetchDate: new Date().toISOString(),
      loading: false,
    };
  }

  return currentVisualizationData;
}

/**
 * Convert data from both service sources into a common format.
 *
 * The format is {<service-name>: {alias: <service-alias>, mobsosIDs: [<mobsos-md5-agent-ids>]}}.
 * Example: {"i5.las2peer.services.mobsos.successModeling.MonitoringDataProvisionService":
 * {alias: "mobsos-success-modeling", mobsosIDs: ["3c3df6941ac59070c01d45611ce15107"]}}
 */
function mergeServiceData(
  serviceCollection: ServiceCollection,
  servicesFromL2P,
  servicesFromMobSOS,
): ServiceCollection {
  serviceCollection = cloneDeep(serviceCollection);
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
        if (!service?.name) continue;
        let serviceIdentifier = `${service?.name as string}.`;
        if (!serviceIdentifier) continue;
        if (!latestRelease?.supplement?.class) continue;
        serviceIdentifier += latestRelease?.supplement?.class;

        serviceCollection[serviceIdentifier] = {
          name: serviceIdentifier,
          alias: latestRelease?.supplement?.name,
          mobsosIDs: [],
          serviceMessageDescriptions:
            serviceCollection[serviceIdentifier]
              ?.serviceMessageDescriptions,
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
      const registrationTime: number =
        servicesFromMobSOS[serviceAgentID]?.registrationTime;
      if (!serviceAlias) {
        serviceAlias = serviceName;
      }

      serviceCollection[serviceName] = {
        ...serviceCollection[serviceName],
        name: serviceName,
        alias: serviceAlias,
      };

      let mobsosIDs = serviceCollection[serviceName].mobsosIDs;
      if (!mobsosIDs) {
        mobsosIDs = [];
      }

      mobsosIDs.push({
        agentID: serviceAgentID,
        registrationTime,
      });

      mobsosIDs?.sort(
        (a, b) => a.registrationTime - b.registrationTime,
      );

      serviceCollection[serviceName].mobsosIDs = mobsosIDs.slice(
        0,
        100,
      );
    }
  }
  return serviceCollection;
}

// const ONE_YEAR = 1601968704;

// function getMessageDescriptionForService(
//   messageDescriptions,
//   serviceIdentifier: string,
// ) {
//   let serviceMessageDescriptions = {};
//   if (messageDescriptions && messageDescriptions[serviceIdentifier])
//     serviceMessageDescriptions =
//       messageDescriptions[serviceIdentifier];

//   return serviceMessageDescriptions;
// }

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
  groupsFromMobSOS?,
) {
  groups = cloneDeep(groups) ||{};

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
  if (!groupsFromMobSOS) return groups as GroupCollection;
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

  return groups as GroupCollection;
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
  communityWorkspace: CommunityWorkspace,
  owner: string,
  selectedServiceName: string,
  props: {
    factor: SuccessFactor;
    dimensionName: string;
  },
) {
  const copy = cloneDeep(communityWorkspace) as CommunityWorkspace;
  const appWorkspace = getWorkspaceByUserAndService(
    copy,
    owner,
    selectedServiceName,
  );
  if (!appWorkspace) return communityWorkspace;
  const successModel = appWorkspace.model;
  if (!successModel) return communityWorkspace;
  let factorsList = successModel.dimensions[props.dimensionName];
  if (!factorsList) factorsList = [];
  factorsList.unshift(props.factor);
  successModel.dimensions[props.dimensionName] = factorsList;
  return copy;
}

function removeFactor(
  communityWorkspace: CommunityWorkspace,
  owner: string,
  selectedServiceName: string,
  factorName: string,
) {
  const copy = cloneDeep(communityWorkspace) as CommunityWorkspace;
  const appWorkspace = getWorkspaceByUserAndService(
    copy,
    owner,
    selectedServiceName,
  );
  if (!appWorkspace) return communityWorkspace;
  const successModel = appWorkspace.model;
  if (!successModel) return communityWorkspace;
  for (const [dimensionName, dimension] of Object.entries(
    successModel.dimensions,
  )) {
    successModel.dimensions[dimensionName] = dimension?.filter(
      (factor: SuccessFactor) => factor.name !== factorName,
    );
  }
  return copy;
}

function removeMeasure(
  communityWorkspace: CommunityWorkspace,
  owner: string,
  selectedServiceName: string,
  measureName: string,
) {
  if (!measureName) return communityWorkspace;
  const copy = cloneDeep(communityWorkspace) as CommunityWorkspace;
  const appWorkspace = getWorkspaceByUserAndService(
    copy,
    owner,
    selectedServiceName,
  );
  if (!appWorkspace) return communityWorkspace;
  const successModel = appWorkspace.model;

  // delete all occurences of the measure in the successModel
  for (const [dimensionName, dimension] of Object.entries(
    successModel.dimensions,
  )) {
    const factorsCopy = [];
    for (const factor of dimension) {
      factorsCopy.push({
        ...factor,
        measures: factor.measures?.filter(
          (measure) => measure !== measureName,
        ),
      });
    }
    successModel.dimensions[dimensionName] = factorsCopy;
  }

  return copy;
}
function editFactorInDimension(
  factor: SuccessFactor,
  oldFactorName: string,
  dimensionName: string,
  communityWorkspace: CommunityWorkspace,
  owner: string,
  serviceName: string,
) {
  const copy = cloneDeep(communityWorkspace) as CommunityWorkspace;
  const appWorkspace = getWorkspaceByUserAndService(
    copy,
    owner,
    serviceName,
  );
  const successModel = appWorkspace?.model;
  if (!successModel) return communityWorkspace;
  const factorsList = successModel.dimensions[dimensionName];
  if (!factorsList) return communityWorkspace;
  for (let i = 0; i < factorsList.length; i++) {
    const f = factorsList[i];
    if (f.name === oldFactorName) {
      factorsList[i] = factor;
    }
  }
  successModel.dimensions[dimensionName] = factorsList;
  appWorkspace.model = successModel;
  copy[owner][serviceName] = appWorkspace;
  return copy;
}

function addMeasureToMeasureCatalog(
  measure: Measure,
  communityWorkspace: CommunityWorkspace,
  owner: string,
  serviceName: string,
) {
  const copy = cloneDeep(communityWorkspace) as CommunityWorkspace;
  const appWorkspace = getWorkspaceByUserAndService(
    copy,
    owner,
    serviceName,
  );
  const measureMap = appWorkspace.catalog?.measures;
  measureMap[measure.name] = measure;
  return copy;
}

function addMeasureToFactorInModel(
  communityWorkspace: CommunityWorkspace,
  owner: string,
  selectedServiceName: string,
  props: {
    measure: Measure;
    factorName: string;
    dimensionName: string;
  },
) {
  if (!props.dimensionName) return communityWorkspace;

  const copy = cloneDeep(communityWorkspace) as CommunityWorkspace;
  const appWorkspace = getWorkspaceByUserAndService(
    copy,
    owner,
    selectedServiceName,
  );
  const successModel = appWorkspace.model;

  const factor = successModel.dimensions[props.dimensionName].find(
    (f: SuccessFactor) => f.name === props.factorName,
  );

  factor.measures.unshift(props.measure.name);

  return copy;
}

function updateMeasure(
  communityWorkspace: CommunityWorkspace,
  owner: string,
  serviceName: string,

  props: {
    measure: Measure;
    oldMeasureName: string;
    factorName?: string;
    dimensionName?: string;
  },
  catalogOnly?: boolean,
) {
  const copy = cloneDeep(communityWorkspace) as CommunityWorkspace;
  const appWorkspace = getWorkspaceByUserAndService(
    copy,
    owner,
    serviceName,
  );
  if (!appWorkspace) return communityWorkspace;

  const measureCatalog = appWorkspace.catalog;
  const successModel = appWorkspace.model;
  // update the measure catalog

  // commented out because of an issue with success modeling service - ONLY HOTFIX
  // delete measureCatalog.measures[props.oldMeasureName];
  measureCatalog.measures[props.measure.name] = props.measure;
  if (catalogOnly) {
    return copy;
  }

  // update the success model
  let factors = successModel.dimensions[props.dimensionName];
  factors = factors.map((factor: SuccessFactor) =>
    factor.name === props.factorName
      ? {
          ...factor,
          measures: factor.measures.map((m: string) =>
            m === props.oldMeasureName ? props.measure.name : m,
          ),
        }
      : factor,
  );
  successModel.dimensions[props.dimensionName] = factors;
  return copy;
}

// function updateMeasureInSuccessModel(
//   dimensions: DimensionMap,
//   props: {
//     measure: Measure;
//     oldMeasureName: string;
//     factorName: string;
//     dimensionName: string;
//   },
// ) {
//   const copyDimensions = { ...dimensions };
//   let copyFactors = [...copyDimensions[props.dimensionName]];
//   copyFactors = copyFactors.map((factor) =>
//     factor.name === props.factorName
//       ? updateMeasureInFactor(
//           factor,
//           props.measure,
//           props.oldMeasureName,
//         )
//       : factor,
//   );
//   copyDimensions[props.dimensionName] = copyFactors;
//   return copyDimensions;
// }

// function updateMeasureInFactor(
//   factor: SuccessFactor,
//   measure: Measure,
//   oldMeasureName: string,
// ) {
//   const copy = [...factor.measures];
//   return copy.map((m) =>
//     measure.name === oldMeasureName ? measure : m,
//   );
// }

function getSelectedService(state: AppState) {
  if (!state.services || !state.selectedServiceName) return undefined;
  return state.services[state.selectedServiceName];
}
// function addVisitor(
//   communityWorkspace: CommunityWorkspace,
//   username: string,
//   owner: string,
//   serviceName: string,
//   role: UserRole,
// ): CommunityWorkspace {
//   const copy = cloneDeep(communityWorkspace); // copy workspace first
//   const userWorkspace = copy[owner];
//   if (!userWorkspace) return communityWorkspace;
//   const appWorkspace: ApplicationWorkspace =
//     userWorkspace[serviceName];
//   if (!appWorkspace) return communityWorkspace;
//   let visitor = appWorkspace.visitors?.find(
//     (v) => v.username === username,
//   );
//   if (role === UserRole.LURKER) {
//     if (visitor) {
//       username =
//         username + ' (guest ' + appWorkspace.visitors.length + ')';
//     }
//     appWorkspace.visitors.push(new Visitor(username, role));
//   } else if (!visitor) {
//     visitor = new Visitor(username, role);
//     appWorkspace.visitors.push(visitor);
//   }
//   return copy;
// }

function getWorkspaceByUserAndService(
  communityWorkspace: CommunityWorkspace,
  user: string,
  service: string,
) {
  if (
    !communityWorkspace ||
    !Object.keys(communityWorkspace).includes(user)
  ) {
    return;
  }
  const userWorkspace = communityWorkspace[user];
  if (!Object.keys(userWorkspace).includes(service)) {
    return;
  }
  return userWorkspace[service];
}
function removeVisualizationData(
  visualizationData: VisualizationCollection,
  query: string,
): VisualizationCollection {
  const copy = { ...visualizationData };
  delete copy[query];
  return copy;
}
function addGroup(
  group: GroupInformation,
  groups: GroupCollection,
): GroupCollection {
  if (!group?.id) {
    return groups;
  }
  const copy = cloneDeep(groups) as GroupCollection;
  copy[group.id] = group;
  return copy;
}
function removeMeasureFromCatalog(
  measureName: string,
  communityWorkspace: CommunityWorkspace,
  owner: string,
  selectedServiceName: string,
): CommunityWorkspace {
  if (!measureName) return communityWorkspace;
  const copy = cloneDeep(communityWorkspace) as CommunityWorkspace;
  const appWorkspace = getWorkspaceByUserAndService(
    copy,
    owner,
    selectedServiceName,
  );
  if (!appWorkspace) return communityWorkspace;
  const catalog = appWorkspace.catalog;

  delete catalog.measures[measureName];
  return copy;
}

function updateRequirements(
  state: AppState,
  requirements: Requirement[],
) {
  const copy = cloneDeep(
    state.communityWorkspace,
  ) as CommunityWorkspace;
  const appWorkspace = getWorkspaceByUserAndService(
    copy,
    state.currentWorkSpaceOwner,
    state.selectedServiceName,
  );
  if (!appWorkspace) return state.communityWorkspace;
  appWorkspace.requirements = requirements;
  return copy;
}
function addServiceDescriptions(
  services: ServiceCollection,
  descriptions: { [key: string]: string },
  serviceName: string,
) {
  const copy = cloneDeep(services) as ServiceCollection;
  if (!serviceName) return services;
  if (serviceName in copy) {
    copy[serviceName] = {
      ...copy[serviceName],
      serviceMessageDescriptions: descriptions,
    };
  }
  return copy;
}

function resetFetchDateForQuery(
  visualizationData: VisualizationCollection,
  query: string,
): VisualizationCollection {
  if (!(query in visualizationData)) return visualizationData;
  const copy = cloneDeep(
    visualizationData,
  ) as VisualizationCollection;

  copy[query] = {
    ...copy[query],
    fetchDate: undefined,
    loading: true,
  };
  return copy;
}
function addModelToCurrentWorkSpace(
  state: AppState,
  xml: string,
): CommunityWorkspace {
  const serviceName = state.selectedServiceName;
  const owner = state.currentWorkSpaceOwner;
  const copy = cloneDeep(
    state.communityWorkspace,
  ) as CommunityWorkspace;
  const appWorkspace = getWorkspaceByUserAndService(
    copy,
    owner,
    serviceName,
  );
  const doc = parseXml(xml);
  const model = SuccessModel.fromXml(doc.documentElement);
  appWorkspace.model = model;
  return copy;
}

function addCatalogToCurrentWorkSpace(state: AppState, xml: string) {
  const serviceName = state.selectedServiceName;
  const owner = state.currentWorkSpaceOwner;
  const copy = cloneDeep(
    state.communityWorkspace,
  ) as CommunityWorkspace;
  const appWorkspace = getWorkspaceByUserAndService(
    copy,
    owner,
    serviceName,
  );
  const doc = parseXml(xml);
  const catalog = MeasureCatalog.fromXml(doc.documentElement);
  appWorkspace.catalog = catalog;
  return copy;
}
function addQuestionnaireToSuccessModel(
  state: AppState,
  questionnaire: Questionnaire,
): CommunityWorkspace {
  const serviceName = state.selectedServiceName;
  const owner = state.currentWorkSpaceOwner;
  const copy = cloneDeep(
    state.communityWorkspace,
  ) as CommunityWorkspace;
  const appWorkspace = getWorkspaceByUserAndService(
    copy,
    owner,
    serviceName,
  );
  if (!appWorkspace.model.questionnaires) {
    appWorkspace.model.questionnaires = [];
  }
  appWorkspace.model.questionnaires.push(questionnaire);
  return copy;
}
