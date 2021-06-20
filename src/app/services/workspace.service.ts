import { Store } from '@ngrx/store';
import {
  ApplicationWorkspace,
  CommunityWorkspace,
} from '../models/workspace.model';
import { updateCommunityWorkspace } from './store.actions';
import { Injectable, isDevMode } from '@angular/core';
import { BehaviorSubject, of, Subscription } from 'rxjs';
import {
  cloneDeep,
  isEqual,
  isEmpty,
  isPlainObject,
} from 'lodash-es';
import { Doc, Map } from 'yjs';
import { UserRole, Visitor } from '../models/user.model';
import { MeasureCatalog } from '../models/measure.catalog';
import { SuccessModel } from '../models/success.model';
import { ServiceInformation } from '../models/service.model';
import { WebsocketProvider } from 'y-websocket';
import { environment } from 'src/environments/environment';
import { COMMUNITY_WORKSPACE } from './store.selectors';
import {
  catchError,
  distinctUntilChanged,
  filter,
  first,
  shareReplay,
  tap,
  throttle,
  throttleTime,
  timeout,
} from 'rxjs/operators';
const ONE_MINUTE_IN_MS = 60000;
@Injectable({
  providedIn: 'root',
})
export class WorkspaceService {
  // copy of the last group id. This will be used to stop synchronizing the old workspace if a new one is created
  private currentGroupId: string;

  /**
   * This subject should always contain the current community workspace state
   */
  private communityWorkspace$ =
    new BehaviorSubject<CommunityWorkspace>({});

  get communityWorkspace() {
    return this.communityWorkspace$.asObservable();
  }
  // object containing cleanup functions to be invoked when the type is no longer needed
  private removeListenersCallbacks: { [key: string]: () => void } =
    {};
  private sharedDocument = new Doc();
  private syncDone$: BehaviorSubject<boolean> =
    new BehaviorSubject<boolean>(undefined);

  constructor(private ngrxStore: Store) {
    // updates the workspace in store
    this.communityWorkspace$.subscribe((workspace) => {
      this.ngrxStore.dispatch(
        updateCommunityWorkspace({ workspace }),
      );
    });
    this.ngrxStore
      .select(COMMUNITY_WORKSPACE)
      .pipe(throttleTime(5)) // throttle time is absolutely needed here to prevent synchronization loops between store and yjs
      .subscribe((workspace) => {
        if (
          !isEqual(workspace, this.communityWorkspace$.getValue())
        ) {
          this.communityWorkspace$.next(workspace);
        }
      });
    const provider = new WebsocketProvider(
      environment.yJsWebsocketUrl,
      'mobsos-ec', // room name
      this.sharedDocument, // collection of properties which will be synced
    );
  }

  /**
   * Initializes the workspace and synchronizes with yjs
   * @param groupID  the group id of the current community
   * @param username the username of the current user
   * @param selectedService the service which is currently selected
   * @param measureCatalog the measure catalog of the community
   * @param successModel the success model of the community.
   * @returns local view on the current application workspace
   */
  initWorkspace(
    groupID: string,
    username: string,
    selectedService: ServiceInformation,
    measureCatalog?: MeasureCatalog,
    successModel?: SuccessModel,
  ) {
    if (!username) {
      console.error('user cannot be null');
      return;
    }
    // get the current workspace state from yjs
    const communityWorkspace =
      this.getCurrentCommunityWorkspace(groupID);

    /*******************************
     * Add our local stuff to the community workspace
     */
    if (!Object.keys(communityWorkspace).includes(username)) {
      communityWorkspace[username] = {};
    }
    const userWorkspace = communityWorkspace[username];
    if (!Object.keys(userWorkspace).includes(selectedService.name)) {
      if (!measureCatalog) {
        measureCatalog = new MeasureCatalog({});
      }
      if (!successModel) {
        successModel =
          SuccessModel.emptySuccessModel(selectedService);
      }
      userWorkspace[selectedService.name] = {
        createdAt: new Date().toISOString(),
        createdBy: username,
        visitors: [],
        catalog: measureCatalog,
        model: successModel,
        service: selectedService,
      };
    }
    // update the local reference
    this.communityWorkspace$.next(communityWorkspace);
    // after initializing our local workspace we start the synchronizing with yjs
    this.startSynchronizingWorkspace(groupID);

    return communityWorkspace;
  }

  /**
   * Used to join a community workspace
   * @param groupId group ID of the community which we want to join
   * @returns true when the synchronization with yjs is done, false if there is an error or timeout occurs
   */
  syncWithCommunnityWorkspace(groupId: string) {
    // get the current workspace state from yjs
    const communityWorkspace =
      this.getCurrentCommunityWorkspace(groupId);
    this.communityWorkspace$.next(communityWorkspace);
    this.startSynchronizingWorkspace(groupId);
    return this.syncDone$.asObservable().pipe(
      timeout(ONE_MINUTE_IN_MS),
      filter((syncDone) => syncDone === true),
      catchError(() => of(false)),
      first(),
      shareReplay(1),
    );
  }

  /**
   * Helper function to get the current community workspace from yjs
   * @param groupId group id of the current commnunity
   * @returns  shared community workspace object
   */
  getCurrentCommunityWorkspace(groupId: string): CommunityWorkspace {
    return cloneDeep(this.getSyncedMap(groupId));
  }

  /**
   * This fucntion stops synchronizing the workspace
   * @param groupId id of the current community
   */
  stopSynchronizingWorkspace(groupId: string) {
    if (groupId) {
      this.stopSync(groupId);
      this.communityWorkspace$.next({});
      this.currentGroupId = undefined;
    }
  }

  /**
   * This function start synchronizing the workspace for the current community
   * @param groupId groupid for the community
   */
  startSynchronizingWorkspace(groupId: string) {
    if (groupId && groupId !== this.currentGroupId) {
      if (this.currentGroupId) {
        this.stopSynchronizingWorkspace(this.currentGroupId);
      }
      this.syncObject(groupId, this.communityWorkspace$);
      this.currentGroupId = groupId;
    }
  }

  /**
   * This function is used to remove the application workspace of the current user from the community workspace
   * This should be called when a new service is selected
   * @param username username of the current user
   * @param serviceName name of the application
   */
  removeWorkspace(username: string, serviceName: string) {
    const communityWorkspace = this.communityWorkspace$.getValue();
    if (!communityWorkspace) return;
    if (!Object.keys(communityWorkspace).includes(username)) {
      return;
    }
    const userWorkspace = communityWorkspace[username];
    if (!Object.keys(userWorkspace).includes(serviceName)) {
      return;
    }
    delete userWorkspace[serviceName];
    this.communityWorkspace$.next(communityWorkspace);
  }

  /**
   * This function is used to copy the application workspace of someone else in the community
   * @param owner the owner of the workspace wich we want to copy
   * @param username the username of the current user
   * @param serviceName the name of the application
   * @returns the newly copied workspace. If either userWorkspace or ownerWorkspace are undefined then this will return undefined
   */
  copyWorkspace(
    owner: string,
    username: string,
    serviceName: string,
  ): ApplicationWorkspace {
    const communityWorkspace = this.communityWorkspace$.getValue();
    if (!Object.keys(communityWorkspace).includes(username)) {
      return;
    }
    const userWorkspace = this.getWorkspaceByUserAndService(
      username,
      serviceName,
    );
    const ownerWorkspace = this.getWorkspaceByUserAndService(
      owner,
      serviceName,
    );
    if (!userWorkspace || !ownerWorkspace) {
      return;
    }
    userWorkspace.catalog = cloneDeep(ownerWorkspace.catalog);
    userWorkspace.model = cloneDeep(ownerWorkspace.model);

    communityWorkspace[username][serviceName] = userWorkspace;
    this.communityWorkspace$.next(communityWorkspace);
    return userWorkspace;
  }

  switchWorkspace(
    owner: string,
    currentServiceName: string,
    username: string,
    oldWorkspaceOwner?: string,
    role?: UserRole,
  ): CommunityWorkspace {
    if (!owner) {
      throw new Error('owner cannot be null');
    }
    this.leaveWorkspace(
      oldWorkspaceOwner,
      currentServiceName,
      username,
    );
    const communityWorkspace = cloneDeep(
      this.communityWorkspace$.getValue(),
    );
    if (!communityWorkspace[owner]) {
      throw new Error(
        'Cannot join workspace as it is not know in communityWorkspace',
      );
    }
    const currentApplicationWorkspace =
      communityWorkspace[owner][currentServiceName];
    if (!currentApplicationWorkspace) {
      throw new Error(
        'this user has no application workspace for the current service',
      );
    }

    const visitors = currentApplicationWorkspace.visitors;
    const containedInVisitors = visitors.find(
      (visitor) => visitor.username === username,
    );
    const guestVisitors = visitors.filter((visitor) =>
      visitor.username.includes('(guest'),
    );

    if (role === UserRole.LURKER) {
      const n = guestVisitors.length + 1;
      username = username + ' (guest ' + n + ')'; // We cannot ensure unique usernames for Lurkers so we add a unique suffix
      localStorage.setItem('visitor-username', username); // save in localStorage so in the future anonymous user gets reassigned the same name
      visitors.push(new Visitor(username, role));
    }
    // logged in users are added if they are not a visitor yet
    else if (owner !== username && !containedInVisitors) {
      visitors.push({
        username,
        role: UserRole.SPECTATOR,
      });
    }
    visitors.sort((a, b) => (a.username > b.username ? 1 : -1));
    currentApplicationWorkspace.visitors = visitors;
    communityWorkspace[owner][currentServiceName].visitors = visitors;
    this.communityWorkspace$.next(communityWorkspace);
    return this.communityWorkspace$.getValue();
  }

  private leaveWorkspace(
    owner: string,
    currentServiceName: string,
    username: string,
  ) {
    if (!owner || !currentServiceName) return;
    const appWorkspace = cloneDeep(
      this.getWorkspaceByUserAndService(owner, currentServiceName),
    );
    if (!appWorkspace) {
      return;
    }
    const visitors = appWorkspace.visitors?.filter(
      (visitor) => visitor.username !== username,
    );
    appWorkspace.visitors = visitors;
    const communityWorkspace = cloneDeep(
      this.communityWorkspace$.getValue(),
    );
    communityWorkspace[owner][currentServiceName] = appWorkspace;
    this.communityWorkspace$.next(communityWorkspace);
  }

  private getWorkspaceByUserAndService(
    user: string,
    service: string,
  ) {
    const communityWorkspace = this.communityWorkspace$.getValue();
    if (!Object.keys(communityWorkspace).includes(user)) {
      return;
    }
    const userWorkspace = communityWorkspace[user];
    if (!Object.keys(userWorkspace).includes(service)) {
      return;
    }
    return userWorkspace[service];
  }

  private getSyncedMap(name: string) {
    return this.sharedDocument.getMap(name).toJSON();
  }

  private syncObject(name: string, subject: BehaviorSubject<object>) {
    const type = this.sharedDocument.get(name);
    const map = this.sharedDocument.getMap(name);
    subject.pipe(throttleTime(10)).subscribe((obj) => {
      // if the subject changes the object will be synced with yjs
      if (isDevMode()) {
        console.log('Pushing local changes to remote y-js map...');
      }
      this._syncObjectToMap(cloneDeep(obj), map);
    });

    const observeFn = () => {
      if (isDevMode()) {
        console.log('Applying remote changes to local object...');
      }
      const cloneObj = cloneDeep(map.toJSON());
      if (!isEqual(subject.getValue(), cloneObj)) {
        subject.next(cloneObj);
      }
      this.syncDone$.next(true);
    };
    this.sharedDocument.on('update', observeFn);

    this.syncDone$.next(true);

    // this.stopSync(name);
    // deposit cleanup function to be called when the type is no longer needed
    this.removeListenersCallbacks[name] = () => {
      type.unobserve(observeFn);
      // type.unobserveDeep(observeFn);
    };
  }

  private stopSync(name: string) {
    if (this.removeListenersCallbacks[name]) {
      this.removeListenersCallbacks[name]();
      delete this.removeListenersCallbacks[name];
    }
  }

  /**
   * Recursively updates the values in the shared map to the changes made to the local object
   * @param obj The local object from which we want to update the changes
   * @param map our yjs map
   * @param init true if the local object has been initialized yet
   * @returns true if successfull
   */
  private _syncObjectToMap(obj: object, map: Map<any>) {
    try {
      const mapAsObj = map.toJSON();
      if (isEqual(obj, mapAsObj)) {
        return true;
      }
      // delete elements that are present in the map but not in the object.
      // only delete them on if initialized before to prevent deleting other workspaces
      const deletedKeys = Object.keys(mapAsObj).filter(
        (key) => !Object.keys(obj).includes(key),
      );
      deletedKeys.map((deletedKey) => map.delete(deletedKey));

      // sync elements from object to map
      for (const key of Object.keys(obj)) {
        const objValue = obj[key];
        let mapValue = map.get(key);
        if (isEqual(objValue, mapValue)) {
          continue;
        }
        // use YMap if value is an object and use the value itself otherwise
        if (isPlainObject(objValue)) {
          if (!(mapValue instanceof Map)) {
            map.set(key, new Map());
            mapValue = map.get(key);
          }
          this._syncObjectToMap(objValue, mapValue);
        } else {
          if (objValue !== null) {
            map.set(key, JSON.parse(JSON.stringify(objValue))); // make sure to set only objects which can be parsed as JSON
          }
        }
      }
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  changeVisitorRole(
    visitorName: string,
    owner: string,
    selectedServiceName: string,
    role: string,
  ): ApplicationWorkspace {
    const communityWorkspace = cloneDeep(
      this.communityWorkspace$.getValue(),
    ) as CommunityWorkspace;
    const ownerWorkspace = communityWorkspace[owner];
    if (!ownerWorkspace) {
      console.error('owner workspace not found');
      return;
    }
    const applicationWorkspace = ownerWorkspace[selectedServiceName];
    if (!applicationWorkspace) {
      console.error('app workspace not found for current user');
    }
    const visitors = applicationWorkspace.visitors.map((visitor) =>
      visitor.username === visitorName
        ? {
            ...visitor,
            role:
              role === 'editor'
                ? UserRole.EDITOR
                : UserRole.SPECTATOR,
          }
        : visitor,
    );
    applicationWorkspace.visitors = visitors;
    this.communityWorkspace$.next(communityWorkspace);
    return applicationWorkspace;
  }
}
