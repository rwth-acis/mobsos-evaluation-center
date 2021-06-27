import { Store } from '@ngrx/store';
import {
  ApplicationWorkspace,
  CommunityWorkspace,
} from '../models/workspace.model';
import { setCommunityWorkspace } from './store.actions';
import { Injectable, isDevMode } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import {
  cloneDeep,
  isEqual,
  isPlainObject,
  isEmpty,
} from 'lodash-es';
import * as Y from 'yjs';
import { UserRole, Visitor } from '../models/user.model';
import { MeasureCatalog } from '../models/measure.catalog';
import { SuccessModel } from '../models/success.model';
import { ServiceInformation } from '../models/service.model';
import { WebsocketProvider } from 'y-websocket';
import { environment } from 'src/environments/environment';
import {
  _COMMUNITY_WORKSPACE,
  _SELECTED_SERVICE_NAME,
} from './store.selectors';
import {
  catchError,
  distinctUntilChanged,
  filter,
  first,
  throttleTime,
  timeout,
} from 'rxjs/operators';
import { VisualizationData } from '../models/visualization.model';

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

  // object containing cleanup functions to be invoked when the type is no longer needed
  private removeListenersCallbacks: { [key: string]: () => void } =
    {};
  private sharedDocument = new Y.Doc();
  private syncDone$: BehaviorSubject<boolean> =
    new BehaviorSubject<boolean>(undefined); // True when the sync with yjs is done
  provider: WebsocketProvider;

  /**
   * This service is used to sync between local state and remote yjs map.
   * @param ngrxStore Store which contains the local app state
   */
  constructor(private ngrxStore: Store) {
    const provider = new WebsocketProvider(
      environment.yJsWebsocketUrl,
      'mobsos-ec', // room name
      this.sharedDocument, // collection of properties which will be synced
    );

    // updates the workspace in store
    this.communityWorkspace$.subscribe((workspace) => {
      if (!isEmpty(workspace)) {
        this.ngrxStore.dispatch(setCommunityWorkspace({ workspace }));
      }
    });
    // updates the workspace subject with updates from the store
    this.ngrxStore
      .select(_COMMUNITY_WORKSPACE)
      .pipe(
        distinctUntilChanged(),
        throttleTime(5), // throttle time is absolutely needed here to prevent synchronization loops between store and yjs
        filter(
          (workspace) =>
            !!workspace &&
            !isEqual(workspace, this.communityWorkspace$.getValue()),
        ),
      )
      .subscribe((workspace) => {
        this.communityWorkspace$.next(workspace);
      });
  }

  /**
   * an observable of the community workspace
   */
  get communityWorkspace() {
    return this.communityWorkspace$.asObservable();
  }

  /**
   * the value of the current community workspace
   */
  get currentCommunityWorkspace() {
    return this.communityWorkspace$.getValue();
  }

  /**
   * Initializes the workspace for a given user and service inside the current community workspace.
   * @param groupID  the group id of the current community
   * @param username the username of the current user
   * @param selectedService the service which is currently selected
   * @param measureCatalog the measure catalog of the community
   * @param successModel the success model of the community.
   */
  initWorkspace(
    groupID: string,
    username: string,
    selectedService: ServiceInformation,
    measureCatalog?: MeasureCatalog,
    successModel?: SuccessModel,
    visualizationData?: VisualizationData,
  ) {
    if (!username) {
      throw new Error('user cannot be null');
    }
    if (!selectedService) {
      throw new Error('service cannot be null');
    }
    // get the current workspace state from yjs
    const communityWorkspace =
      this.getCurrentCommunityWorkspaceFromYJS(groupID);

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
        visualizationData,
      };
    }
    // update the subject which in turn will send an update to yjs
    this.communityWorkspace$.next(communityWorkspace);
    // // after initializing our local workspace we start the synchronizing with yjs
    this.syncObject(groupID);
  }

  /**
   * Used to join a community workspace
   * @param groupId group ID of the community which we want to join
   * @returns true when the synchronization with yjs is done, false if there is an error or timeout occurs
   */
  syncWithCommunnityWorkspace(groupId: string): Observable<boolean> {
    if (this.syncDone$.getValue()) return of(true);

    this.startSynchronizingWorkspace(groupId);
    // get the current workspace state from yjs
    const communityWorkspace =
      this.getCurrentCommunityWorkspaceFromYJS(groupId);
    if (communityWorkspace) {
      this.syncDone$.next(true);
    }
    this.communityWorkspace$.next(communityWorkspace);
    return this.syncDone$.asObservable().pipe(
      timeout(2 * ONE_MINUTE_IN_MS),
      filter((syncDone) => syncDone === true),
      catchError(() => of(false)),
      first(),
    );
  }

  /**
   * Helper function to get the current community workspace from yjs
   * @param groupId group id of the current commnunity
   * @returns community workspace object
   */
  private getCurrentCommunityWorkspaceFromYJS(
    groupId: string,
  ): CommunityWorkspace {
    return cloneDeep(this.sharedDocument.getMap(groupId).toJSON());
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
    if (groupId !== this.currentGroupId) {
      if (this.currentGroupId) {
        this.stopSynchronizingWorkspace(this.currentGroupId);
      }
      this.currentGroupId = groupId;
      this.syncObject(groupId);
    }
  }

  /**
   * This function is used to remove the application workspace of the current user from the community workspace
   * This should be called when a new service is selected
   * @param username username of the current user
   * @param serviceName name of the application
   */
  removeWorkspace(username: string, serviceName: string) {
    const communityWorkspace = cloneDeep(
      this.communityWorkspace$.getValue(),
    );
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
    model?: SuccessModel,
    catalog?: MeasureCatalog,
    role?: UserRole,
    vdata?: VisualizationData,
  ) {
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
    const currentApplicationWorkspace = communityWorkspace[owner][
      currentServiceName
    ] as ApplicationWorkspace;
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

    if (
      role === UserRole.LURKER &&
      !username.includes('(guest') &&
      !containedInVisitors
    ) {
      const n = guestVisitors.length + 1;
      username = username + ' (guest ' + n + ')'; // We cannot ensure unique usernames for Lurkers so we add a unique suffix
      localStorage.setItem('visitor-username', username); // in the future anonymous user gets reassigned the same name
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
    // communityWorkspace[owner][currentServiceName].visitors = visitors;
    if (owner === username) {
      currentApplicationWorkspace.catalog = catalog;
      currentApplicationWorkspace.model = model;
    }
    if (role !== UserRole.LURKER && vdata) {
      const vdataInWorkspace =
        currentApplicationWorkspace.visualizationData;
      for (const [query, data] of Object.entries(vdata)) {
        if (
          data.data &&
          (!vdataInWorkspace[query] ||
            data.fetchDate > vdataInWorkspace[query].fetchDate)
        ) {
          // Workspace visualization data non-existant or local visualization data more recent
          vdataInWorkspace[query] = data;
        }
      }
    }
    this.communityWorkspace$.next(communityWorkspace);
    this.syncObject(this.currentGroupId);
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

  private syncObject(name: string) {
    // const type = this.sharedDocument.get(name);
    const map = this.sharedDocument.getMap(name);
    this.communityWorkspace$
      .pipe(
        throttleTime(10),
        filter((obj) => !isEmpty(obj) && !isEqual(obj, map.toJSON())),
      )
      .subscribe((obj) => {
        // if the subject changes the object will be synced with yjs
        if (isDevMode()) {
          console.log('Pushing local changes to remote y-js map...');
        }
        this.sharedDocument.transact(() => {
          this._syncObjectToMap(cloneDeep(obj), map);
        });
      });

    // this.sharedDocument.on('update', () => this.observeFn(map));
    map.observeDeep(() => this.observeFn(map));
    this.removeListenersCallbacks[name] = () => {
      map.unobserve(() => this.observeFn(map));
    };
  }

  private observeFn(map) {
    if (isDevMode()) {
      console.log('Applying remote changes to local object...');
    }
    const cloneObj = cloneDeep(map.toJSON());
    if (!isEqual(cloneObj, this.communityWorkspace$.getValue())) {
      this.communityWorkspace$.next(cloneObj);
    }

    this.syncDone$.next(true);
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
  private _syncObjectToMap(obj: object, map: Y.Map<any>) {
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
          if (!(mapValue instanceof Y.Map)) {
            map.set(key, new Y.Map());
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
}
