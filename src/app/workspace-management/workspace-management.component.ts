import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';

import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import {
  disableEdit,
  setService,
  success,
  toggleEdit,
} from '../services/store.actions';

import { cloneDeep } from 'lodash';
import { User, UserRole, Visitor } from '../models/user.model';
import { FormControl } from '@angular/forms';
import {
  EDIT_MODE,
  IS_MEMBER_OF_SELECTED_GROUP,
  MEASURE_CATALOG,
  ROLE_IN_CURRENT_WORKSPACE,
  SELECTED_GROUP,
  SELECTED_SERVICE,
  SERVICES,
  SUCCESS_MODEL,
  USER,
  USER_IS_OWNER_IN_CURRENT_WORKSPACE,
  WORKSPACE_INITIALIZED,
} from '../services/store.selectors';
import { combineLatest, Subscription } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { WorkspaceService } from '../services/workspace.service';
import { SuccessModel } from '../models/success.model';
import { MeasureCatalog } from '../models/measure.catalog';
import { ServiceInformation } from '../models/service.model';
import {
  ApplicationWorkspace,
  CommunityWorkspace,
} from '../models/workspace.model';
import { NGXLogger } from 'ngx-logger';

@Component({
  selector: 'app-workspace-management',
  templateUrl: './workspace-management.component.html',
  styleUrls: ['./workspace-management.component.scss'],
})
export class WorkspaceManagementComponent
  implements OnInit, OnDestroy
{
  communityWorkspace: CommunityWorkspace = {};
  workspaceUser: string;
  numberOfRequirements = 0;
  successModel$ = this.ngrxStore.select(SUCCESS_MODEL);
  successModel: SuccessModel;
  measureCatalog$ = this.ngrxStore.select(MEASURE_CATALOG);
  measureCatalog: MeasureCatalog;
  serviceSelectForm = new FormControl('');
  selectedService: ServiceInformation;
  selectedServiceName: string;
  services$ = this.ngrxStore.select(SERVICES);
  editMode$ = this.ngrxStore.select(EDIT_MODE);
  roleInWorkspace$ = this.ngrxStore.select(ROLE_IN_CURRENT_WORKSPACE);
  userIsOwner$ = this.ngrxStore.select(
    USER_IS_OWNER_IN_CURRENT_WORKSPACE,
  );
  user$ = this.ngrxStore.select(USER);
  user: User;
  memberOfGroup$ = this.ngrxStore.select(IS_MEMBER_OF_SELECTED_GROUP);
  workspaceInitialized$ = this.ngrxStore.select(
    WORKSPACE_INITIALIZED,
  );
  selectedService$ = this.ngrxStore.select(SELECTED_SERVICE);
  selectedGroup$ = this.ngrxStore.select(SELECTED_GROUP);
  showEditButton$ = combineLatest([
    this.selectedGroup$,
    this.selectedService$,
    this.workspaceInitialized$,
  ]).pipe(
    map(([group, service, init]) => !!group && !!service && init),
  );

  subscriptions$: Subscription[] = [];
  constructor(
    private dialog: MatDialog,
    private translate: TranslateService,
    private workspaceService: WorkspaceService,
    private ngrxStore: Store,
    private logger: NGXLogger,
  ) {}

  ngOnInit(): void {
    const subscription = this.selectedService$
      .pipe(filter((service) => service !== undefined))
      .subscribe((service) => {
        this.selectedServiceName = service.name;
        // this is used so that the initial success model is fetched. We should rather use a new effect for this
        this.serviceSelectForm.setValue(
          service.alias ? service.alias : this.selectedServiceName,
        ); // set the value in the selection
        subscription.unsubscribe();
      });
    let sub = this.editMode$.subscribe((editMode) => {
      if (editMode) {
        const parent = this;
        this.initWorkspace().then(() =>
          // this is not working currently
          parent.switchWorkspace(parent.getMyUsername()),
        );
      }
    });
    this.subscriptions$.push(sub);
    sub = this.successModel$.subscribe((successModel) => {
      this.successModel = successModel;
    });
    this.subscriptions$.push(sub);
    sub = this.measureCatalog$.subscribe((measureCatalog) => {
      this.measureCatalog = measureCatalog;
    });
    this.subscriptions$.push(sub);
    sub = this.user$.subscribe((user) => {
      this.user = user;
    });
    this.subscriptions$.push(sub);
  }

  setWorkspaceUser(user: string) {
    this.workspaceUser = user;
  }

  setWorkspace(workspace: CommunityWorkspace) {
    this.communityWorkspace = workspace;
  }

  /**
   * Initializes the workspace for collaborative success modeling
   */
  private async initWorkspace() {
    const parent = this;
    await this.workspaceService
      .waitUntilWorkspaceIsSynchronized()
      .then(() => {
        const myUsername = parent.getMyUsername();
        parent.setWorkspaceUser(myUsername);
        if (
          !Object.keys(parent.communityWorkspace).includes(myUsername)
        ) {
          parent.communityWorkspace[myUsername] = {};
        }
        const userWorkspace = parent.communityWorkspace[myUsername];
        if (
          !Object.keys(userWorkspace).includes(
            parent.selectedServiceName,
          )
        ) {
          if (!parent.measureCatalog) {
            parent.measureCatalog = new MeasureCatalog({});
          }
          if (!parent.successModel) {
            parent.successModel = SuccessModel.emptySuccessModel(
              parent.selectedService,
            );
          }
          userWorkspace[this.selectedServiceName] = {
            createdAt: new Date().toISOString(),
            createdBy: myUsername,
            visitors: [],
            catalog: this.measureCatalog,
            model: this.successModel,
          };
        }
        parent.persistWorkspaceChanges();
      });
  }

  onServiceSelected(service: ServiceInformation) {
    this.ngrxStore.dispatch(disableEdit());
    this.ngrxStore.dispatch(setService({ service }));
  }

  onEditModeChanged() {
    this.ngrxStore.dispatch(toggleEdit());
  }

  getAllWorkspacesForCurrentService(): ApplicationWorkspace[] {
    if (!this.communityWorkspace) {
      return;
    }
    const result = [];
    if (!this.selectedServiceName) {
      return [];
    }
    const userWorkspaces = Object.values(this.communityWorkspace);
    for (const userWorkspace of userWorkspaces) {
      if (
        Object.keys(userWorkspace).includes(this.selectedServiceName)
      ) {
        result.push(userWorkspace[this.selectedServiceName]);
      }
    }
    return result;
  }

  getAllWorkspacesForCurrentServiceExceptActive() {
    if (!this.getAllWorkspacesForCurrentService()) {
      return;
    }
    return this.getAllWorkspacesForCurrentService().filter(
      (workspace) => workspace.createdBy !== this.workspaceUser,
    );
  }

  getNumberOfOpenWorkspacesFromOtherUsers(): number {
    const myUsername = this.getMyUsername();
    return this.getAllWorkspacesForCurrentService()?.filter(
      (workspace) => workspace.createdBy !== myUsername,
    ).length;
  }

  getNumberOfOtherWorkspaceVisitors(): number {
    const visitors = this.getCurrentVisitorsExceptMe();
    if (visitors == null) {
      return 0;
    }
    return visitors.length;
  }

  getCurrentVisitors(): Visitor[] {
    const workspace = this.getCurrentWorkspace();
    if (workspace == null || workspace.visitors instanceof Array) {
      return [];
    }
    return workspace.visitors;
  }

  getCurrentVisitorsExceptMe(): Visitor[] {
    const visitors = this.getCurrentVisitors();
    return visitors.filter(
      (visitor) => visitor.username !== this.getMyUsername(),
    );
  }

  private getCurrentWorkspace(): ApplicationWorkspace {
    return this.getWorkspaceByUserAndService(
      this.workspaceUser,
      this.selectedServiceName,
    );
  }
  switchWorkspace(user: string) {
    this.workspaceUser = user;
    const workspace = this.getCurrentWorkspace();
    if (!workspace) {
      return;
    }
    const visitors = workspace.visitors;
    const myUsername = this.getMyUsername();
    const meAsVisitorArr = visitors.filter(
      (visitor) => visitor.username === myUsername,
    );
    if (
      meAsVisitorArr.length === 0 &&
      this.workspaceUser !== myUsername
    ) {
      visitors.push({
        username: myUsername,
        role: UserRole.SPECTATOR,
      });
      visitors.sort((a, b) => (a.username > b.username ? 1 : -1));
      this.persistWorkspaceChanges();
    }
  }

  private persistWorkspaceChanges() {
    this.workspaceService.setCommunityWorkspace(
      this.communityWorkspace,
    );
  }

  changeVisitorRole(visitorName: string, role: string) {
    const visitors = this.getCurrentWorkspace().visitors;
    const visitorSearchResult = visitors.filter(
      (visitor) => visitor.username === visitorName,
    );
    if (visitorSearchResult) {
      visitorSearchResult[0].role = UserRole[role];
      this.persistWorkspaceChanges();
    }
  }

  // getMyRole(): string {
  //   const myUsername = this.getMyUsername();
  //   const workspace = this.getCurrentWorkspace();
  //   if (!workspace) {
  //     return null;
  //   }
  //   if (workspace.createdBy === myUsername) {
  //     return 'owner';
  //   }
  //   const visitors = workspace.visitors;
  //   const visitorSearchResult = visitors.find(
  //     (visitor) => visitor.username === myUsername,
  //   );
  //   if (visitorSearchResult) {
  //     return visitorSearchResult.role;
  //   }
  //   return 'spectator';
  // }

  async openCopyWorkspaceDialog(owner: string) {
    const message = await this.translate
      .get('success-modeling.copy-workspace-prompt')
      .toPromise();
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      minWidth: 300,
      data: message,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.copyWorkspace(owner);
      }
    });
  }
  private getMyUsername() {
    if (!this.user) {
      return null;
    }
    return this.user.profile.preferred_username;
  }

  private async openClearWorkspaceDialog() {
    // only open this dialog if a user is logged in, because else the user's workspace should not be removed anyway
    if (this.user) {
      const message = await this.translate
        .get('success-modeling.discard-changes-prompt')
        .toPromise();
      const dialogRef = this.dialog.open(
        ConfirmationDialogComponent,
        {
          minWidth: 300,
          data: message,
        },
      );
      dialogRef.afterClosed().subscribe((result) => {
        if (result) {
          this.removeWorkspace();
        }
      });
    }
  }

  private getWorkspaceByUserAndService(
    user: string,
    service: string,
  ): ApplicationWorkspace {
    if (!this.communityWorkspace) {
      return;
    }
    if (!Object.keys(this.communityWorkspace).includes(user)) {
      return null;
    }
    const userWorkspace = this.communityWorkspace[user];
    if (!Object.keys(userWorkspace).includes(service)) {
      return null;
    }
    return userWorkspace[service];
  }

  private removeWorkspace() {
    const myUsername = this.user.profile.preferred_username;
    if (!Object.keys(this.communityWorkspace).includes(myUsername)) {
      return;
    }
    const userWorkspace = this.communityWorkspace[myUsername];
    if (
      !Object.keys(userWorkspace).includes(this.selectedServiceName)
    ) {
      return;
    }
    delete userWorkspace[this.selectedServiceName];
    this.persistWorkspaceChanges();
  }

  private copyWorkspace(owner: string) {
    const myUsername = this.getMyUsername();
    if (!Object.keys(this.communityWorkspace).includes(myUsername)) {
      return;
    }
    const myWorkspace = this.getWorkspaceByUserAndService(
      myUsername,
      this.selectedServiceName,
    );
    const ownerWorkspace = this.getWorkspaceByUserAndService(
      owner,
      this.selectedServiceName,
    );
    if (!myWorkspace || !ownerWorkspace) {
      return;
    }
    myWorkspace.catalog = cloneDeep(ownerWorkspace.catalog);
    myWorkspace.model = cloneDeep(ownerWorkspace.model);
    this.persistWorkspaceChanges();
  }

  ngOnDestroy() {
    this.subscriptions$.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
