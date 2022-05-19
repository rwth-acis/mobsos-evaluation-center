import { Store } from '@ngrx/store';
import {
  ApplicationWorkspace,
  CommunityWorkspace,
  UserRole,
  Visitor,
} from '../models/workspace.model';
import { setCommunityWorkspace } from './store/store.actions';
import { Injectable, isDevMode } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { cloneDeep, isEqual, isEmpty } from 'lodash-es';
import * as Y from 'yjs';

import { SuccessModel } from '../models/success.model';
import { ServiceInformation } from '../models/service.model';
import { WebsocketProvider } from 'y-websocket';
import { environment } from 'src/environments/environment';
import { _COMMUNITY_WORKSPACE } from './store/store.selectors';
import {
  catchError,
  distinctUntilChanged,
  filter,
  take,
  throttleTime,
  timeout,
} from 'rxjs/operators';
import { VisualizationCollection } from '../models/visualization.model';
import { MeasureCatalog } from '../models/measure.model';

const ONE_MINUTE_IN_MS = 60000;
/**
 * Service for managing the workspace of the application. The workspace is synced using yjs
 */
@Injectable({
  providedIn: 'root',
})
export class WorkspaceService {
  provider: WebsocketProvider;

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

  /**
   * This service is used to sync between local state and remote yjs map.
   *
   * @param ngrxStore Store which contains the local app state
   */
  constructor(private ngrxStore: Store) {
    this.provider = new WebsocketProvider(
      environment.yJsWebsocketUrl,
      'mobsos-ec', // room name
      this.sharedDocument, // collection of properties which will be synced
    );

    // updates the workspace in store
    this.communityWorkspace$.subscribe((workspace) => {
      if (workspace && !isEmpty(workspace)) {
        this.ngrxStore.dispatch(setCommunityWorkspace({ workspace }));
      }
    });
    // updates the workspace subject with updates from the store
    this.ngrxStore
      .select(_COMMUNITY_WORKSPACE)
      .pipe(
        distinctUntilChanged(),
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
  get communityWorkspace(): Observable<CommunityWorkspace> {
    return this.communityWorkspace$.asObservable();
  }

  /**
   * the current value of the current community workspace
   */
  get currentCommunityWorkspaceValue(): CommunityWorkspace {
    return this.communityWorkspace$.getValue();
  }

  /**
   * Initializes the workspace for a given user and service inside the current community workspace.
   *
   * @param groupID  the group id of the current community
   * @param username the username of the current user
   * @param selectedService the service which is currently selected
   * @param measureCatalog the measure catalog of the community
   * @param successModel the success model of the community.
   * @param copyModel whether
   */
  initWorkspace(
    groupID: string,
    username: string,
    selectedService: ServiceInformation,
    measureCatalog?: MeasureCatalog,
    successModel?: SuccessModel,
    visualizationData?: VisualizationCollection,
    copyModel?: boolean,
  ): void {
    if (!username) {
      throw new Error('user cannot be null');
    }
    if (!selectedService) {
      throw new Error('service cannot be null');
    }
    // get the current workspace state from yjs
    const communityWorkspace =
      this.getCurrentCommunityWorkspaceFromYJS(groupID) || {};
    /** *****************************
     * Add our local stuff to the community workspace
     */
    if (!Object.keys(communityWorkspace).includes(username)) {
      communityWorkspace[username] = {};
    }
    const userWorkspace = communityWorkspace[username] || {};

    if (!Object.keys(userWorkspace).includes(selectedService.name)) {
      if (!measureCatalog) {
        measureCatalog = new MeasureCatalog({});
      }
      if (!copyModel || !successModel) {
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
   *
   * @param groupId group ID of the community which we want to join
   * @returns true when the synchronization with yjs is done, false if there is an error or timeout occurs
   */
  syncWithCommunnityWorkspace(groupId: string): Observable<boolean> {
    this.currentGroupId = groupId;
    if (this.syncDone$.getValue()) return of(true);

    this.startSynchronizingWorkspace(groupId);
    // get the current workspace state from yjs
    let communityWorkspace =
      this.getCurrentCommunityWorkspaceFromYJS(groupId);

    setTimeout(() => {
      communityWorkspace =
        this.getCurrentCommunityWorkspaceFromYJS(groupId);
      if (communityWorkspace) {
        this.syncDone$.next(true);
      }
    }, 200);

    this.communityWorkspace$.next(communityWorkspace);
    return this.syncDone$.asObservable().pipe(
      timeout(2 * ONE_MINUTE_IN_MS),
      filter((syncDone) => syncDone),
      catchError(() => of(false)),
      take(1),
    );
  }

  /**
   * This fucntion stops synchronizing the workspace
   *
   * @param groupId id of the current community
   */
  stopSynchronizingWorkspace(
    groupId: string = this.currentGroupId,
  ): void {
    if (groupId) {
      this.stopSync(groupId);
      this.communityWorkspace$.next({});
      this.currentGroupId = undefined;
    }
  }

  /**
   * This function is used to remove the application workspace of the current user from the community workspace
   * This should be called when a new service is selected
   *
   * @param username username of the current user
   * @param serviceName name of the application
   */
  removeWorkspace(username: string, serviceName: string): void {
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
   *
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

    if (
      !communityWorkspace ||
      !Object.keys(communityWorkspace).includes(username)
    ) {
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

  /**
   * Chagnes the role of a visitor in the workspace.
   *
   * @param visitorName Name that identifies the visitor
   * @param owner The owner of the workspace
   * @param selectedServiceName  The name of the service
   * @param role The new role of the visitor
   * @returns  The updated workspace
   */
  changeVisitorRole(
    visitorName: string,
    owner: string,
    selectedServiceName: string,
    role: string,
  ): ApplicationWorkspace {
    const communityWorkspace = cloneDeep(
      this.communityWorkspace$.getValue(),
    );
    const ownerWorkspace = communityWorkspace[owner];
    if (!ownerWorkspace) {
      console.error('owner workspace not found');
      return;
    }
    const applicationWorkspace = ownerWorkspace[selectedServiceName];
    if (!applicationWorkspace) {
      console.error('app workspace not found for current user');
      return;
    }
    const newRole = role as UserRole;
    applicationWorkspace.visitors = applicationWorkspace.visitors.map(
      (visitor) =>
        visitor.username === visitorName
          ? {
              ...visitor,
              role: newRole,
            }
          : visitor,
    );
    this.communityWorkspace$.next(communityWorkspace);
    return applicationWorkspace;
  }

  /**
   * Join the workspace of a user
   *
   * @param newWorkspaceOwner  The owner of the workspace  to be joined
   * @param serviceName The application workspace is identified by the service name
   * @param username The usernames of the user that wants to join the workspace
   * @param currentWorkspaceOwner  The owner of the workspace that the user is currently in.
   *                                If specified, the user will be removed from that workspace
   * @param model If specified, the model will be copied to the new workspace
   * @param catalog The catalog to be used in the new workspace
   * @param role The role to be set for the user in the new workspace
   * @param vdata  The visualization data to be used in the new workspace
   */
  joinWorkspace(
    newWorkspaceOwner: string,
    serviceName: string,
    username: string,
    currentWorkspaceOwner?: string,
    model?: SuccessModel,
    catalog?: MeasureCatalog,
    role?: UserRole,
    vdata?: VisualizationCollection,
  ): void {
    if (!newWorkspaceOwner) {
      throw new Error('owner cannot be null');
    }
    this.leaveWorkspace(currentWorkspaceOwner, serviceName, username);
    const communityWorkspace = cloneDeep(
      this.communityWorkspace$.getValue(),
    );
    if (!communityWorkspace[newWorkspaceOwner]) {
      throw new Error(
        'Cannot join workspace as it is not know in communityWorkspace',
      );
    }
    let currentApplicationWorkspace =
      communityWorkspace[newWorkspaceOwner][serviceName];
    if (!currentApplicationWorkspace) {
      throw new Error(
        'this user has no application workspace for the current service',
      );
    }

    if (vdata) {
      currentApplicationWorkspace = updateWorkSpaceVisualizationData(
        vdata,
        currentApplicationWorkspace,
      );
    }

    if (username === newWorkspaceOwner) {
      if (model) currentApplicationWorkspace.model = model;
      if (catalog) {
        currentApplicationWorkspace.catalog = addMeasuresToWorkspace(
          currentApplicationWorkspace.catalog,
          catalog,
        );
      }
    }

    if (newWorkspaceOwner !== username) {
      // add the user as visitor to the workspace if it is not the owner
      currentApplicationWorkspace.visitors = addUserToVisitors(
        currentApplicationWorkspace.visitors,
        username,
        role,
      );
    }

    this.communityWorkspace$.next(communityWorkspace);
    setTimeout(() => {
      this.syncObject(this.currentGroupId);
    });
  }

  /**
   * Function to leave the workspace of a user
   *
   * @param owner  The owner of the workspace
   * @param currentServiceName  The name of the service
   * @param username  The username of the user
   */
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
    appWorkspace.visitors = appWorkspace.visitors?.filter(
      (visitor) => visitor.username !== username,
    );
    const communityWorkspace = cloneDeep(
      this.communityWorkspace$.getValue(),
    );
    communityWorkspace[owner][currentServiceName] = appWorkspace;
    this.communityWorkspace$.next(communityWorkspace);
  }

  /**
   * Function which syncs a JSON object with yjs
   *
   * @param name name of the group used as room identifier
   */
  private syncObject(name: string) {
    const map = this.sharedDocument.getMap(name);
    this.communityWorkspace$
      .pipe(
        throttleTime(10),
        filter(
          (obj) =>
            !!obj && !isEmpty(obj) && !isEqual(obj, map.toJSON()),
        ),
      )
      .subscribe((obj) => {
        // if the subject changes the object will be synced with yjs
        if (isDevMode()) {
          console.log('Pushing local changes to remote y-js map...');
        }
        this.sharedDocument.transact(() => {
          this._syncObjectToMap(cloneDeep(obj), map);
        }, this.sharedDocument.clientID);
      });
    const sharedDoc = this.sharedDocument;
    map.observeDeep((event, transaction) => {
      if (!sharedDoc || transaction.origin !== sharedDoc.clientID) {
        // if the map changes because of another client, the subject will be updated
        this.applyRemoteChanges(map);
      }
    });
    this.removeListenersCallbacks[name] = () => {
      map.unobserve(() => this.applyRemoteChanges(map));
    };
  }

  /**
   * This function start synchronizing the workspace for the current community
   *
   * @param groupId groupid for the community
   */
  private startSynchronizingWorkspace(groupId: string) {
    if (groupId !== this.currentGroupId) {
      if (this.currentGroupId) {
        this.stopSynchronizingWorkspace(this.currentGroupId);
      }
      this.currentGroupId = groupId;
      this.syncObject(groupId);
    }
  }

  private applyRemoteChanges(map) {
    if (isDevMode()) {
      console.log('Applying remote changes to local object...');
    }
    const cloneObj = cloneDeep(map.toJSON()) as CommunityWorkspace;
    if (!isEqual(cloneObj, this.communityWorkspace$.getValue())) {
      this.communityWorkspace$.next(cloneObj);
    }
    if (!this.syncDone$.getValue()) {
      this.syncDone$.next(true);
    }
  }

  /**
   * Stops synchronizing the workspace for the current community
   *
   * @param name name of the group used as room identifier
   */
  private stopSync(name: string) {
    if (this.removeListenersCallbacks[name]) {
      this.removeListenersCallbacks[name](); // calls unobserve
      delete this.removeListenersCallbacks[name];
    }
  }

  /**
   * Helper function to get the current community workspace from yjs
   *
   * @param groupId group id of the current commnunity
   * @returns community workspace object
   */
  private getCurrentCommunityWorkspaceFromYJS(
    groupId: string,
  ): CommunityWorkspace {
    return cloneDeep(
      this.sharedDocument.getMap(groupId).toJSON(),
    ) as CommunityWorkspace;
  }

  /**
   * Recursively updates the values in the shared map to the changes made to the local object
   *
   * @param obj The local object from which we want to update the changes
   * @param map our yjs map
   * @param init true if the local object has been initialized yet
   * @returns true if successfull
   */
  private _syncObjectToMap(
    obj: Record<string, unknown>,
    map: Y.Map<any>,
  ) {
    // console.time('syncObjectToMap');
    try {
      const mapAsObj = map.toJSON() as CommunityWorkspace;
      if (isEqual(obj, mapAsObj)) {
        // console.timeEnd('syncObjectToMap');
        return true;
      }
      const keys = Object.keys(obj);
      for (const key of keys) {
        map.set(key, obj[key]);
      }
      // console.timeEnd('syncObjectToMap');
      return true;
      // // delete elements that are present in the map but not in the object.
      // // only delete them on if initialized before to prevent deleting other workspaces
      // const deletedKeys = Object.keys(mapAsObj).filter(
      //   (key) => !Object.keys(obj).includes(key),
      // );
      // deletedKeys.map((deletedKey) => map.delete(deletedKey));

      // // sync elements from object to map
      // for (const key of Object.keys(obj)) {
      //   const objValue = obj[key];
      //   let mapValue = map.get(key);
      //   if (isEqual(objValue, mapValue)) {
      //     continue;
      //   }
      //   // use YMap if value is an object and use the value itself otherwise
      //   if (isPlainObject(objValue)) {
      //     if (!(mapValue instanceof Y.Map)) {
      //       map.set(key, new Y.Map());
      //       mapValue = map.get(key);
      //     }
      //     this._syncObjectToMap(
      //       objValue as Record<string, unknown>,
      //       mapValue,
      //     );
      //   } else {
      //     try {
      //       if (objValue !== null) {
      //         map.set(key, JSON.parse(JSON.stringify(objValue))); // make sure to set only objects which can be parsed as JSON
      //       }
      //     } catch (error) {
      //       console.error(error);
      //     }
      //   }
      // }
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  /**
   * Function to get the workspace of a user and a service
   *
   * @param user  username of the user
   * @param service  name of the service
   * @returns   the workspace of the user and the service
   */
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

/**
 * Function which adds a user to the visitors of the workspace
 *
 * @param visitors the current visitors of the workspace
 * @param username  the username of the user to add
 * @param role  the role of the user to add
 * @returns  the updated visitors of the workspace
 */
function addUserToVisitors(
  visitors: Visitor[],
  username: string,
  role: UserRole,
): Visitor[] {
  const userAlreadyVisitor = visitors.some(
    (visitor) => visitor.username === username,
  );
  if (userAlreadyVisitor) {
    return visitors;
  }

  if (role === UserRole.LURKER && !username.includes('(guest')) {
    // hacky way to not add lurkers that joined once again.
    const lurkers = visitors.filter((visitor) =>
      visitor.username.includes('(guest'),
    );
    const n = lurkers.length + 1;
    username = username + ' (guest ' + n.toString() + ')'; // We cannot ensure unique usernames for Lurkers so we add a unique suffix
    localStorage.setItem('visitor-username', username); // on future rejoins anonymous user gets reassigned the same name
  }
  visitors.push(new Visitor(username, role));
  return visitors.sort();
}

/**
 * Updates the visualization data of the workspace by only replacing the data if it is more recent than the current data
 *
 * @param vdata  our local visualization data
 * @param currentApplicationWorkspace  the current application workspace
 * @returns  the updated visualization data
 */
function updateWorkSpaceVisualizationData(
  vdata: VisualizationCollection,
  currentApplicationWorkspace: ApplicationWorkspace,
): ApplicationWorkspace {
  for (const [query, value] of Object.entries(vdata)) {
    if (value.data && value?.fetchDate) {
      let workspaceData =
        currentApplicationWorkspace.visualizationData[query];
      if (
        !workspaceData?.fetchDate ||
        Date.parse(workspaceData.fetchDate) <
          Date.parse(value?.fetchDate)
      ) {
        // we have more recent data so we add our data
        workspaceData = value;
      }
    }
  }
  return currentApplicationWorkspace;
}
function addMeasuresToWorkspace(
  currentCatalog: MeasureCatalog,
  catalog: MeasureCatalog,
): MeasureCatalog {
  if (!currentCatalog) return catalog;
  if (!catalog) return currentCatalog;
  for (const [key, value] of Object.entries(catalog.measures)) {
    currentCatalog.measures[key] = value;
  }
  return currentCatalog;
}
