import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { NGXLogger } from 'ngx-logger';
import { Las2peerService, Questionnaire } from './las2peer.service';
import { find, isEmpty, throttle } from 'lodash-es';
import {
  distinctUntilChanged,
  filter,
  pairwise,
} from 'rxjs/operators';
import { environment } from '../environments/environment';
import { SuccessModel } from '../success-model/success-model';
import { MeasureCatalog } from '../success-model/measure-catalog';

export interface State {
  servicesFromDiscovery: any[];
  servicesFromMobSOS: any;
  services: ServiceCollection;
  groupsFromContactService: any;
  groupsFromMobSOS: any[];
  groups: GroupCollection;
  user: object;
  selectedGroup: string;
  selectedService: string;
  editMode: boolean;
  questionnaires: Questionnaire[];
  messageDescriptions: object;
}

export interface User {
  profile: { sub: string; preferred_username: string };
  access_token: string;
}

export interface GroupInformation {
  id: string;
  name: string;
  member: boolean;
}

export interface GroupCollection {
  [key: string]: GroupInformation;
}

export interface ServiceInformation {
  name: string;
  alias: string;
  mobsosIDs: { agentID: string; registrationTime: number }[];
  // key is custom message type (such as SERVICE_CUSTOM_MESSAGE_42)
  serviceMessageDescriptions: { [key: string]: string };
}

export interface ServiceCollection {
  [key: string]: ServiceInformation;
}

export interface Visitor {
  username: string;
  role: string;
}

export interface ApplicationWorkspace {
  createdAt: string;
  createdBy: string;
  visitors: Visitor[];
  model: SuccessModel;
  catalog: MeasureCatalog;
}

export interface UserWorkspace {
  // service name is key
  [key: string]: ApplicationWorkspace;
}

export interface CommunityWorkspace {
  // user ID is key
  [key: string]: UserWorkspace;
}
/**
 *
 * @param groupID id of the group
 * @deprecated use ngrxstore instead
 */
@Injectable({
  providedIn: 'root',
})
export class StoreService {
  pollingEnabled = false;
  serviceL2PPollingHandle;
  serviceMobSOSPollingHandle;
  groupContactServicePollingHandle;
  groupMobSOSPollingHandle;
  questionnairePollingHandle;
  messageDescriptionPollingHandle;

  servicesFromDiscoverySubject: BehaviorSubject<any[]>;
  servicesFromMobSOSSubject: BehaviorSubject<any>;
  // merged subject for service data from all sources
  servicesSubject: BehaviorSubject<ServiceCollection>;
  public services: Observable<ServiceCollection>;
  groupsFromContactServiceSubject: BehaviorSubject<any>;
  groupsFromMobSOSSubject: BehaviorSubject<any[]>;
  // merged subject for group data from all sources
  groupsSubject: BehaviorSubject<GroupCollection>;
  public groups: Observable<GroupCollection>;
  questionnairesSubject: BehaviorSubject<Questionnaire[]>;
  public questionnaires: Observable<Questionnaire[]>;
  userSubject: BehaviorSubject<User>;
  public user: Observable<User>;
  selectedGroupSubject: BehaviorSubject<string>;
  public selectedGroup: Observable<string>;
  selectedServiceSubject: BehaviorSubject<string>;
  public selectedService: Observable<string>;
  editModeSubject: BehaviorSubject<boolean>;
  public editMode: Observable<boolean>;
  private messageDescriptionSubject: BehaviorSubject<{}>;

  communityWorkspaceSubject = new BehaviorSubject<CommunityWorkspace>(
    {},
  );
  public communityWorkspace =
    this.communityWorkspaceSubject.asObservable();

  communityWorkspaceInitializedSubject = new BehaviorSubject<boolean>(
    false,
  );
  public communityWorkspaceInitialized =
    this.communityWorkspaceInitializedSubject
      .asObservable()
      .pipe(distinctUntilChanged());

  public yjsConnected: Observable<boolean>;

  constructor(
    private logger: NGXLogger,
    private las2peer: Las2peerService,
  ) {
    // init subjects and observables
    this.initState();

    // workspace sync
    if (this.selectedServiceSubject.getValue()) {
      this.startSynchronizingWorkspace();
    }
    this.selectedGroup.pipe(pairwise()).subscribe((groupData) => {
      if (groupData[0] !== groupData[1]) {
        // stop syncing workspace from previous group
        this.stopSynchronizingWorkspace(groupData[0]);
        // start syncing workspace from current group
        this.startSynchronizingWorkspace(groupData[1]);
        this.editModeSubject.next(false);
      }
    });
    const throtteledSaveStateFunc = throttle(
      () => this.saveState(),
      1000,
    );
    this.services
      .pipe(distinctUntilChanged())
      .subscribe(() => throtteledSaveStateFunc());
    this.groups
      .pipe(distinctUntilChanged())
      .subscribe(() => throtteledSaveStateFunc());
    this.editMode
      .pipe(distinctUntilChanged())
      .subscribe(() => throtteledSaveStateFunc());
    this.user.pipe(distinctUntilChanged()).subscribe((user) => {
      if (user) {
        this.las2peer.setCredentials(
          'OIDC_SUB-' + user.profile.sub,
          user.profile.sub,
          user.access_token,
        );
      } else {
        this.las2peer.resetCredentials();
      }
      // refresh group membership status
      this.mergeGroupData();
      throtteledSaveStateFunc();
    });
    // merge service discovery data from the different sources
    this.servicesFromDiscoverySubject
      .pipe(filter((value) => !isEmpty(value)))
      .subscribe(() => this.mergeServiceData());
    this.servicesFromMobSOSSubject
      .pipe(filter((value) => !isEmpty(value)))
      .subscribe(() => this.mergeServiceData());
    // merge group data from the different sources
    this.groupsFromContactServiceSubject
      .pipe(filter((value) => !isEmpty(value)))
      .subscribe(() => this.mergeGroupData());
    this.groupsFromMobSOSSubject
      .pipe(filter((value) => !isEmpty(value)))
      .subscribe(() => this.mergeGroupData());
    this.messageDescriptionSubject
      .pipe(filter((value) => !isEmpty(value)))
      .subscribe(() => this.mergeServiceData());
    // check if the group data from mobsos is in sync with the group data from the contact service
    this.groupsFromMobSOSSubject.subscribe(() =>
      this.transferGroupDataToMobSOS(),
    );
    // update message descriptions when a service is selected
    this.selectedService
      .pipe(filter((value) => !isEmpty(value)))
      .subscribe((serviceInformation) => {
        this.updateMessageDescriptionsForCurrentService();
      });
  }

  static loadState(): State {
    return JSON.parse(localStorage.getItem('state'));
  }

  startPolling() {
    if (!this.pollingEnabled) {
      this.logger.debug(
        'Enabling service discovery and group polling...',
      );
      if (environment.useLas2peerServiceDiscovery) {
        this.serviceL2PPollingHandle =
          this.las2peer.pollL2PServiceDiscovery(
            (services) => {
              if (services === undefined) {
                services = [];
              }
              this.servicesFromDiscoverySubject.next(services);
            },
            () => {},
          );
      }
      this.serviceMobSOSPollingHandle =
        this.las2peer.pollMobSOSServiceDiscovery(
          (services) => {
            if (services === undefined) {
              services = {};
            }
            this.servicesFromMobSOSSubject.next(services);
          },
          () => {},
        );
      this.groupContactServicePollingHandle =
        this.las2peer.pollContactServiceGroups(
          (groups) => {
            if (groups === undefined) {
              groups = {};
            }
            this.groupsFromContactServiceSubject.next(groups);
          },
          () => {},
        );
      this.groupMobSOSPollingHandle = this.las2peer.pollMobSOSGroups(
        (groups) => {
          if (groups === undefined) {
            return;
          }
          this.groupsFromMobSOSSubject.next(groups);
        },
        () => {},
      );
      this.questionnairePollingHandle =
        this.las2peer.pollMobSOSQuestionnaires(
          (questionnaires) => {
            if (questionnaires === undefined) {
              questionnaires = [];
            }
            this.questionnairesSubject.next(questionnaires);
          },
          () => {},
        );
      this.messageDescriptionPollingHandle = setInterval(
        () => this.updateMessageDescriptionsForCurrentService(),
        environment.servicePollingInterval * 1000,
      );
      this.pollingEnabled = true;
    } else {
      this.logger.debug('Polling already enabled...');
    }
  }

  stopPolling() {
    this.logger.debug(
      'Disabling service discovery and group polling...',
    );
    clearInterval(this.serviceL2PPollingHandle);
    clearInterval(this.serviceMobSOSPollingHandle);
    clearInterval(this.groupContactServicePollingHandle);
    clearInterval(this.groupMobSOSPollingHandle);
    clearInterval(this.questionnairePollingHandle);
    clearInterval(this.messageDescriptionPollingHandle);
    this.serviceL2PPollingHandle = null;
    this.serviceMobSOSPollingHandle = null;
    this.groupContactServicePollingHandle = null;
    this.groupMobSOSPollingHandle = null;
    this.questionnairePollingHandle = null;
    this.messageDescriptionPollingHandle = null;
    this.pollingEnabled = false;
  }

  saveState() {
    try {
      const state = {
        servicesFromDiscovery:
          this.servicesFromDiscoverySubject.getValue(),
        servicesFromMobSOS: this.servicesFromMobSOSSubject.getValue(),
        services: this.servicesSubject.getValue(),
        groupsFromContactService:
          this.groupsFromContactServiceSubject.getValue(),
        groupsFromMobSOS: this.groupsFromMobSOSSubject.getValue(),
        groups: this.groupsSubject.getValue(),
        user: this.userSubject.getValue(),
        selectedGroup: this.selectedGroupSubject.getValue(),
        selectedService: this.selectedServiceSubject.getValue(),
        editMode: this.editModeSubject.getValue(),
        questionnaires: this.questionnairesSubject.getValue(),
        messageDescriptions:
          this.messageDescriptionSubject.getValue(),
      };
      const serializedState = JSON.stringify(state);
      this.logger.debug('Save state to local storage:');
      this.logger.debug(state);
      localStorage.setItem('state', serializedState);
    } catch (err) {
      // ignore write errors
    }
  }

  setUser(user) {
    // console.log(user);
    if (user) {
      // the local storage items will be picked up by the survey frontend
      localStorage.setItem('id_token', user.id_token);
      localStorage.setItem('access_token', user.access_token);
      localStorage.setItem('profile', JSON.stringify(user.profile));
    }
    this.userSubject.next(user);
    // refresh groups from MobSOS to update group membership status
    // this.las2peer.fetchMobSOSGroups().then((groups) => {
    //   this.groupsFromMobSOSSubject.next(groups);
    // });
  }

  startSynchronizingWorkspace(
    name = this.selectedGroupSubject.getValue(),
  ) {
    // if (name) {
    //   this.logger.debug('Synchronizing community workspace via y-js...');
    //   this.yjs.syncObject(
    //     name,
    //     this.communityWorkspaceSubject,
    //     this.communityWorkspaceInitializedSubject
    //   );
    // }
  }

  stopSynchronizingWorkspace(
    name = this.selectedGroupSubject.getValue(),
  ) {
    // if (name) {
    //   this.logger.debug('Stopping community workspace synchronization...');
    //   this.yjs.stopSync(name);
    //   this.communityWorkspaceInitializedSubject.next(false);
    //   this.communityWorkspaceSubject.next({});
    // }
  }

  updateMessageDescriptionsForCurrentService() {
    const serviceInformation = this.selectedServiceSubject.getValue();
    if (serviceInformation) {
      this.las2peer
        .fetchMessageDescriptions(serviceInformation)
        .then((messageDescriptions) => {
          const allMessageDescriptions =
            this.messageDescriptionSubject.getValue();
          allMessageDescriptions[serviceInformation] =
            messageDescriptions;
          this.messageDescriptionSubject.next(allMessageDescriptions);
        });
    }
  }
  /**
   *
   * @param groupID id of the group
   * @deprecated use ngrxstore instead
   */
  setGroup(groupID: string) {
    this.selectedGroupSubject.next(groupID);
  }
  /**
   *
   * @param groupID id of the group
   * @deprecated use ngrxstore instead
   */
  setEditMode(editMode: boolean) {
    this.editModeSubject.next(editMode);
  }

  setCommunityWorkspace(workspace: CommunityWorkspace) {
    this.communityWorkspaceSubject.next(workspace);
  }
  /**
   *
   * @param groupID id of the group
   * @deprecated use ngrxstore instead
   */
  getGroupById(groupId: string): GroupInformation {
    const groups = this.groupsSubject.getValue();
    if (Object.keys(groups).includes(groupId)) {
      return groups[groupId];
    }
    return null;
  }

  async waitUntilWorkspaceIsSynchronized() {
    this.communityWorkspaceInitialized.toPromise();
  }

  private initState() {
    // this.yjsConnected = this.yjs.connected;
    const previousState = StoreService.loadState();

    let initialServicesFromDiscovery = [];
    let initialServicesFromMobSOS = {};
    let initialGroupsFromContactService = {};
    let initialGroupsFromMobSOS = [];
    let initalServices = {};
    let initialGroups = {};
    let initialUser = null;
    let initalSelectedGroup = null;
    let initalSelectedService = null;
    let initialEditMode = false;
    let initalQuestionnaires = [];
    let initialMessageDescriptions = {};

    if (previousState !== null) {
      if (previousState.servicesFromDiscovery) {
        initialServicesFromDiscovery =
          previousState.servicesFromDiscovery;
      }
      if (previousState.servicesFromMobSOS) {
        initialServicesFromMobSOS = previousState.servicesFromMobSOS;
      }
      if (previousState.groupsFromContactService) {
        initialGroupsFromContactService =
          previousState.groupsFromContactService;
      }
      if (previousState.groupsFromMobSOS) {
        initialGroupsFromMobSOS = previousState.groupsFromMobSOS;
      }
      if (previousState.services) {
        initalServices = previousState.services;
      }
      if (previousState.groups) {
        initialGroups = previousState.groups;
      }
      if (previousState.user) {
        initialUser = previousState.user;
      }
      if (previousState.selectedGroup) {
        initalSelectedGroup = previousState.selectedGroup;
      }
      if (previousState.selectedService) {
        initalSelectedService = previousState.selectedService;
      }
      if (previousState.editMode) {
        initialEditMode = previousState.editMode;
      }
      if (previousState.questionnaires) {
        initalQuestionnaires = previousState.questionnaires;
      }
      if (previousState.messageDescriptions) {
        initialMessageDescriptions =
          previousState.messageDescriptions;
      }
    }

    this.servicesFromDiscoverySubject = new BehaviorSubject<any[]>(
      initialServicesFromDiscovery,
    );
    this.servicesFromMobSOSSubject = new BehaviorSubject<any>(
      initialServicesFromMobSOS,
    );
    this.groupsFromContactServiceSubject = new BehaviorSubject<any>(
      initialGroupsFromContactService,
    );
    this.groupsFromMobSOSSubject = new BehaviorSubject<any[]>(
      initialGroupsFromMobSOS,
    );
    this.servicesSubject = new BehaviorSubject<ServiceCollection>(
      initalServices,
    );
    this.groupsSubject = new BehaviorSubject<GroupCollection>(
      initialGroups,
    );
    this.userSubject = new BehaviorSubject<User>(initialUser);
    this.selectedGroupSubject = new BehaviorSubject<string>(
      initalSelectedGroup,
    );
    this.selectedServiceSubject = new BehaviorSubject<string>(
      initalSelectedService,
    );
    this.editModeSubject = new BehaviorSubject<boolean>(
      initialEditMode,
    );
    this.questionnairesSubject = new BehaviorSubject<Questionnaire[]>(
      initalQuestionnaires,
    );
    this.messageDescriptionSubject = new BehaviorSubject<{}>(
      initialMessageDescriptions,
    );

    this.services = this.servicesSubject.asObservable();
    this.groups = this.groupsSubject.asObservable();
    this.user = this.userSubject.asObservable();
    this.selectedGroup = this.selectedGroupSubject.asObservable();
    this.selectedService = this.selectedServiceSubject.asObservable();
    this.editMode = this.editModeSubject.asObservable();
    this.questionnaires = this.questionnairesSubject
      .asObservable()
      .pipe(distinctUntilChanged());
  }

  /**
   * Convert data from both service sources into a common format.
   *
   * The format is {<service-name>: {alias: <service-alias>, mobsosIDs: [<mobsos-md5-agent-ids>]}}.
   * Example: {"i5.las2peer.services.mobsos.successModeling.MonitoringDataProvisionService":
   *            {alias: "mobsos-success-modeling", mobsosIDs: ["3c3df6941ac59070c01d45611ce15107"]}}
   */
  private mergeServiceData() {
    const servicesFromL2P =
      this.servicesFromDiscoverySubject.getValue();
    const serviceCollection: ServiceCollection = {};
    const messageDescriptions =
      this.messageDescriptionSubject.getValue();
    for (const service of servicesFromL2P) {
      // use most recent release and extract the human readable name
      const releases = Object.keys(service.releases).sort();
      const latestRelease = service.releases[releases.slice(-1)[0]];
      const serviceIdentifier =
        service.name + '.' + latestRelease?.supplement?.class;
      const serviceMessageDescriptions = messageDescriptions[
        serviceIdentifier
      ]
        ? messageDescriptions[serviceIdentifier]
        : {};
      serviceCollection[serviceIdentifier] = {
        name: serviceIdentifier,
        alias: latestRelease?.supplement?.name,
        mobsosIDs: [],
        serviceMessageDescriptions,
      };
    }
    const servicesFromMobSOS =
      this.servicesFromMobSOSSubject.getValue();
    for (const serviceAgentID of Object.keys(servicesFromMobSOS)) {
      const serviceName = servicesFromMobSOS[
        serviceAgentID
      ].serviceName.split('@', 2)[0];
      let serviceAlias =
        servicesFromMobSOS[serviceAgentID].serviceAlias;
      const registrationTime =
        servicesFromMobSOS[serviceAgentID].registrationTime;
      if (!serviceAlias) {
        serviceAlias = serviceName;
      }
      const serviceMessageDescriptions = messageDescriptions[
        serviceName
      ]
        ? messageDescriptions[serviceName]
        : {};
      // only add mobsos service data if the data from the discovery is missing

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
        (a, b) => a.registrationTime - b.registrationTime,
      );
      serviceCollection[serviceName].serviceMessageDescriptions =
        serviceMessageDescriptions;
    }
    this.servicesSubject.next(serviceCollection);
  }

  /**
   * Convert data from both group sources into a common format.
   *
   * The format is {<group-ID>: {name: <group-name>, member: (true|false)}}.
   * Example: {"ba1f0b36c32fc90cc3f47db27282ad3dc8b75812ad2d08cf82805c9077567a72d9e3815fc33d7223338dc4f429f89eb3aac0
   *              710b5aec7334821be0a5e84e8daa": {"name": "MyGroup", "member": false}}
   */
  private mergeGroupData() {
    const groups = {};
    const groupsFromContactService =
      this.groupsFromContactServiceSubject.getValue();
    // mark all these groups as groups the current user is a member of
    for (const groupID of Object.keys(groupsFromContactService)) {
      const groupName = groupsFromContactService[groupID];
      groups[groupID] = {
        id: groupID,
        name: groupName,
        member: true,
      };
    }
    // we are going to merge the groups obtained from MobSOS into the previously acquired object
    const groupsFromMobSOS = this.groupsFromMobSOSSubject.getValue();
    for (const group of groupsFromMobSOS) {
      const groupID = group.groupID;
      const groupName = group.name;
      const member = group.isMember;
      if (!(groupID in groups)) {
        groups[groupID] = { id: groupID, name: groupName, member };
      }
    }
    this.groupsSubject.next(groups);
  }

  /**
   * Compare the group data from the contact service to the group data from MobSOS
   * and update the group information in MobSOS if necessary.
   */
  private transferGroupDataToMobSOS() {
    const groupsFromContactService =
      this.groupsFromContactServiceSubject.getValue();
    const groupsFromMobSOS = this.groupsFromMobSOSSubject.getValue();
    for (const groupID of Object.keys(groupsFromContactService)) {
      const groupName = groupsFromContactService[groupID];
      const sameGroupInMobSOS = find(groupsFromMobSOS, [
        'groupID',
        groupID,
      ]);
      if (sameGroupInMobSOS && sameGroupInMobSOS.name === groupName) {
        continue;
      }
      this.las2peer.saveGroupToMobSOS(groupID, groupName);
    }
  }
}
