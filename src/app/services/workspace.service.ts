import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { BehaviorSubject } from 'rxjs';
import {
  ApplicationWorkspace,
  CommunityWorkspace,
} from '../models/workspace.model';
// import { YJsService } from '../y-js.service';

import { cloneDeep } from 'lodash';
import { YjsService } from './yjs.service';
import { updateCommunityWorkspace } from './store.actions';
@Injectable({
  providedIn: 'root',
})
export class WorkspaceService {
  /*****
   * if we need to swith community. We need to reinitilize the workspace
   */
  communityWorkspaceInitialized$ = new BehaviorSubject<boolean>(
    false,
  );
  currentGroupId: string; // copy of the last group id. This will be used to stop synchronizing the old workspace if a new one is created

  /*******************************
   * This subject should always contain the current community workspace state
   */
  communityWorkspace$ = new BehaviorSubject<CommunityWorkspace>({});

  constructor(private yjs: YjsService, private ngrxStore: Store) {
    // updates the workspace in store
    this.communityWorkspace$.subscribe((workspace) => {
      this.ngrxStore.dispatch(
        updateCommunityWorkspace({ workspace }),
      );
    });
  }

  /**
   * This function returns a Promise which will be resolved when the workspace is is synchronized successfully.
   */
  waitUntilWorkspaceIsSynchronized() {
    return this.communityWorkspaceInitialized$
      .asObservable()
      .toPromise();
  }

  /**
   * This initially sets the workspace
   * @param workspace Current local workspace object
   * @param groupId The id of the community. It is used as the name of the yjs room
   */
  setCommunityWorkspace(
    workspace: CommunityWorkspace,
    groupId?: string,
  ) {
    this.startSynchronizingWorkspace(groupId);
    this.communityWorkspace$.next(workspace);
  }

  getCurrentCommunityWorkspace(groupId: string) {
    return this.yjs.getSyncedDocument(groupId);
  }

  /**
   * This fucntion stops synchronizing the workspace
   * @param groupId id of the current community
   */
  stopSynchronizingWorkspace(groupId: string) {
    if (groupId) {
      this.yjs.stopSync(groupId);
      this.communityWorkspaceInitialized$.next(false);
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
      this.stopSynchronizingWorkspace(this.currentGroupId);
      this.yjs.syncObject(
        groupId,
        this.communityWorkspace$,
        this.communityWorkspaceInitialized$,
      );
      this.currentGroupId = groupId;
    }
  }

  /**
   * This function is used to remove the application workspace of the current user from the community workspace
   * @param username username of the current user
   * @param serviceName name of the application
   */
  removeWorkspace(username: string, serviceName: string) {
    const communityWorkspace = this.communityWorkspace$.getValue();
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
  private copyWorkspace(
    owner: string,
    username: string,
    serviceName: string,
  ) {
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
    return userWorkspace;
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
