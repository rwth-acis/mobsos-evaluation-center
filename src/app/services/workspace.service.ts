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
  communityWorkspaceInitialized$ = new BehaviorSubject<boolean>(
    undefined,
  );
  currentGroupId: string;
  communityWorkspace$ = new BehaviorSubject<CommunityWorkspace>({});

  async waitUntilWorkspaceIsSynchronized() {
    this.communityWorkspaceInitialized$.asObservable().toPromise();
  }
  setCommunityWorkspace(
    workspace: CommunityWorkspace,
    groupId?: string,
  ) {
    this.startSynchronizingWorkspace(groupId);
    // this.ngrxStore.dispatch(updateCommunityWorkspace({ workspace }));
    this.communityWorkspace$.next(workspace);
  }

  stopSynchronizingWorkspace(groupId: string) {
    if (groupId) {
      this.yjs.stopSync(groupId);
      this.communityWorkspaceInitialized$.next(false);
      this.communityWorkspace$.next({});
      this.currentGroupId = null;
    }
  }

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
    // userWorkspace.catalog = cloneDeep(ownerWorkspace.catalog);
    userWorkspace.model = cloneDeep(ownerWorkspace.model);
    return userWorkspace;
  }

  private getWorkspaceByUserAndService(
    user: string,
    service: string,
  ) {
    const communityWorkspace = this.communityWorkspace$.getValue();
    if (!Object.keys(communityWorkspace).includes(user)) {
      return null;
    }
    const userWorkspace = communityWorkspace[user];
    if (!Object.keys(userWorkspace).includes(service)) {
      return null;
    }
    return userWorkspace[service];
  }

  private getWorkspaceByUser(
    workspaceUser: string,
    selectedServiceName: string,
  ) {
    return this.getWorkspaceByUserAndService(
      workspaceUser,
      selectedServiceName,
    );
  }

  constructor(private yjs: YjsService, private ngrxStore: Store) {
    this.communityWorkspace$.subscribe((workspace) => {
      this.ngrxStore.dispatch(
        updateCommunityWorkspace({ workspace }),
      );
    });
  }
}
