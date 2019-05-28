import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {NGXLogger} from 'ngx-logger';
import {Las2peerService} from './las2peer.service';
import {find, throttle} from 'lodash-es';
import {distinctUntilChanged} from 'rxjs/operators';
import {environment} from "../environments/environment";

export interface State {
  services: ServiceCollection;
  groups: GroupCollection;
  user: object;
  selectedGroup: string;
  selectedService: string;
}

export interface GroupInformation {
  id: string,
  name: string,
  member: boolean
}

export interface GroupCollection {
  [key: string]: GroupInformation;
}


export interface ServiceInformation {
  alias: string,
  mobsosIDs: string[],
}

export interface ServiceCollection {
  [key: string]: ServiceInformation;
}

@Injectable({
  providedIn: 'root'
})
export class StoreService {

  pollingEnabled = false;
  serviceL2PPollingHandle;
  serviceMobSOSPollingHandle;

  groupContactServicePollingHandle;
  groupMobSOSPollingHandle;

  servicesFromDiscoverySubject = new BehaviorSubject([]);
  servicesFromMobSOSSubject = new BehaviorSubject({});

  // merged subject for service data from all sources
  servicesSubject = new BehaviorSubject<ServiceCollection>({});
  public services = this.servicesSubject.asObservable();

  groupsFromContactServiceSubject = new BehaviorSubject({});
  groupsFromMobSOSSubject = new BehaviorSubject([]);

  // merged subject for group data from all sources
  groupsSubject = new BehaviorSubject<GroupCollection>({});
  public groups = this.groupsSubject.asObservable();

  userSubject = new BehaviorSubject(null);
  public user = this.userSubject.asObservable();
  selectedGroupSubject = new BehaviorSubject(null);
  public selectedGroup = this.selectedGroupSubject.asObservable();
  selectedServiceSubject = new BehaviorSubject(null);
  public selectedService = this.selectedServiceSubject.asObservable();

  constructor(private logger: NGXLogger, private las2peer: Las2peerService) {
    const previousState = StoreService.loadState();
    if (previousState !== null) {
      this.servicesSubject.next(previousState.services);
      this.groupsSubject.next(previousState.groups);
      this.userSubject.next(previousState.user);
      this.selectedGroupSubject.next(previousState.selectedGroup);
      this.selectedServiceSubject.next(previousState.selectedService);
    }
    const throtteledSaveStateFunc = throttle(() => this.saveState(), 10000);
    this.services.pipe(distinctUntilChanged()).subscribe(() => throtteledSaveStateFunc());
    this.groups.pipe(distinctUntilChanged()).subscribe(() => throtteledSaveStateFunc());
    this.user.pipe(distinctUntilChanged()).subscribe((user) => {
      if (user) {
        this.las2peer.setCredentials(user.profile.preferred_username, user.profile.sub, user.access_token);
      } else {
        this.las2peer.resetCredentials();
      }
      throtteledSaveStateFunc();
    });
    // merge service discovery data from the different sources
    this.servicesFromDiscoverySubject.subscribe(() => this.mergeServiceData());
    this.servicesFromMobSOSSubject.subscribe(() => this.mergeServiceData());
    // merge group data from the different sources
    this.groupsFromContactServiceSubject.subscribe(() => this.mergeGroupData());
    this.groupsFromMobSOSSubject.subscribe(() => this.mergeGroupData());
    // check if the group data from mobsos is in sync with the group data from the contact service
    this.groupsFromMobSOSSubject.subscribe(() => this.transferGroupDataToMobSOS())
  }

  static loadState(): State {
    return JSON.parse(localStorage.getItem('state'));
  }

  startPolling() {
    if (!this.pollingEnabled) {
      this.logger.debug('Enabling service discovery and selectedGroup polling...');
      if (environment.useLas2peerServiceDiscovery) {
        this.serviceL2PPollingHandle = this.las2peer.pollL2PServiceDiscovery(
          (services) => {
            if (services === undefined) {
              services = [];
            }
            this.servicesFromDiscoverySubject.next(services);
          },
          () => {
          }
        );
      }
      this.serviceMobSOSPollingHandle = this.las2peer.pollMobSOSServiceDiscovery(
        (services) => {
          if (services === undefined) {
            services = {};
          }
          this.servicesFromMobSOSSubject.next(services);
        },
        () => {
        }
      );
      this.groupContactServicePollingHandle = this.las2peer.pollContactServiceGroups(
        (groups) => {
          if (groups === undefined) {
            groups = {};
          }
          this.groupsFromContactServiceSubject.next(groups);
        },
        () => {
        }
      );
      this.groupMobSOSPollingHandle = this.las2peer.pollMobSOSGroups(
        (groups) => {
          if (groups === undefined) {
            groups = [];
          }
          this.groupsFromMobSOSSubject.next(groups);
        },
        () => {
        }
      );
      this.pollingEnabled = true;
    } else {
      this.logger.debug('Polling already enabled...');
    }
  }

  stopPolling() {
    clearInterval(this.serviceL2PPollingHandle);
    clearInterval(this.serviceMobSOSPollingHandle);
    clearInterval(this.groupContactServicePollingHandle);
    clearInterval(this.groupMobSOSPollingHandle);
    this.serviceL2PPollingHandle = null;
    this.groupContactServicePollingHandle = null;
    this.pollingEnabled = false;
  }

  saveState() {
    try {
      const state = {
        services: this.servicesSubject.getValue(),
        groups: this.groupsSubject.getValue(),
        user: this.userSubject.getValue(),
        selectedGroup: this.selectedGroupSubject.getValue(),
        selectedService: this.selectedServiceSubject.getValue(),
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
    this.userSubject.next(user);
  }

  setGroup(groupID: string) {
    this.selectedGroupSubject.next(groupID);
  }

  /**
   * Convert data from both service sources into a common format.
   *
   * The format is {<service-name>: {alias: <service-alias>, mobsosIDs: [<mobsos-md5-agent-ids>]}}.
   * Example: {"i5.las2peer.services.mobsos.successModeling.MonitoringDataProvisionService": {alias: "mobsos-success-modeling", mobsosIDs: ["3c3df6941ac59070c01d45611ce15107"]}}
   */
  private mergeServiceData() {
    const servicesFromL2P = this.servicesFromDiscoverySubject.getValue();
    const serviceCollection: ServiceCollection = {};
    for (let service of servicesFromL2P) {
      // use most recent release and extract the human readable name
      const releases = Object.keys(service.releases).sort();
      const latestRelease = service.releases[releases.slice(-1)[0]];
      const serviceIdentifier = service.name + '.' + latestRelease.supplement.class;
      serviceCollection[serviceIdentifier] = {alias: latestRelease.supplement.name, mobsosIDs: []};
    }
    const servicesFromMobSOS = this.servicesFromMobSOSSubject.getValue();
    for (let serviceAgentID of Object.keys(servicesFromMobSOS)) {
      const serviceName = servicesFromMobSOS[serviceAgentID].serviceName.split('@', 2)[0];
      let serviceAlias = servicesFromMobSOS[serviceAgentID].serviceAlias;
      if (serviceAlias == null) {
        serviceAlias = serviceName;
      }
      // only add mobsos service data if the data from the discovery is missing
      if (!(serviceName in serviceCollection)) {
        serviceCollection[serviceName] = {alias: serviceAlias, mobsosIDs: []}
      }
      serviceCollection[serviceName]['mobsosIDs'].push(serviceAgentID);
    }
    this.servicesSubject.next(serviceCollection);
  }

  /**
   * Convert data from both group sources into a common format.
   *
   * The format is {<group-ID>: {name: <group-name>, member: (true|false)}}.
   * Example: {"ba1f0b36c32fc90cc3f47db27282ad3dc8b75812ad2d08cf82805c9077567a72d9e3815fc33d7223338dc4f429f89eb3aac0710b5aec7334821be0a5e84e8daa": {"name": "MyGroup", "member": false}}
   */
  private mergeGroupData() {
    const groups = {};
    const groupsFromContactService = this.groupsFromContactServiceSubject.getValue();
    // mark all these groups as groups the current user is a member of
    for (let groupID of Object.keys(groupsFromContactService)) {
      const groupName = groupsFromContactService[groupID];
      groups[groupID] = {id: groupID, name: groupName, member: true}
    }
    // we are going to merge the groups obtained from MobSOS into the previously acquired object
    const groupsFromMobSOS = this.groupsFromMobSOSSubject.getValue();
    for (let group of groupsFromMobSOS) {
      const groupID = group.groupID;
      const groupName = group.name;
      const member = group.isMember;
      if (!(groupID in groups)) {
        groups[groupID] = {id: groupID, name: groupName, member: member};
      }
    }
    this.groupsSubject.next(groups);
  }

  /**
   * Compare the group data from the contact service to the group data from MobSOS
   * and update the group information in MobSOS if necessary.
   */
  private transferGroupDataToMobSOS() {
    const groupsFromContactService = this.groupsFromContactServiceSubject.getValue();
    const groupsFromMobSOS = this.groupsFromMobSOSSubject.getValue();
    for (let groupID of Object.keys(groupsFromContactService)) {
      const groupName = groupsFromContactService[groupID];
      const sameGroupInMobSOS = find(groupsFromMobSOS, ['groupID', groupID]);
      if (sameGroupInMobSOS && sameGroupInMobSOS.name === groupName) {
        continue;
      }
      this.las2peer.saveGroupToMobSOS(groupID, groupName);
    }
  }
}
