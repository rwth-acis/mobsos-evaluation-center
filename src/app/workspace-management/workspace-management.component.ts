import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';

import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import {
  disableEdit,
  setService,
  setWorkSpaceOwner,
  toggleEdit,
} from '../services/store.actions';

import { cloneDeep } from 'lodash';
import { User, UserRole } from '../models/user.model';
import { FormControl } from '@angular/forms';
import {
  ALL_WORKSPACES_FOR_SELECTED_SERVICE_EXCEPT_ACTIVE,
  VISITORS_EXCEPT_USER,
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
  APPLICATION_WORKSPACE,
  ASSETS_LOADED,
} from '../services/store.selectors';
import { combineLatest, Subscription } from 'rxjs';
import { filter, map, withLatestFrom } from 'rxjs/operators';
import { WorkspaceService } from '../services/workspace.service';
import { SuccessModel } from '../models/success.model';
import { MeasureCatalog } from '../models/measure.catalog';
import { ServiceInformation } from '../models/service.model';
import {
  ApplicationWorkspace,
  CommunityWorkspace,
} from '../models/workspace.model';

@Component({
  selector: 'app-workspace-management',
  templateUrl: './workspace-management.component.html',
  styleUrls: ['./workspace-management.component.scss'],
})
export class WorkspaceManagementComponent
  implements OnInit, OnDestroy
{
  // Observables from store
  successModel$ = this.ngrxStore.select(SUCCESS_MODEL);
  measureCatalog$ = this.ngrxStore.select(MEASURE_CATALOG);
  workspacesForServiceExceptActive$ = this.ngrxStore.select(
    ALL_WORKSPACES_FOR_SELECTED_SERVICE_EXCEPT_ACTIVE,
  );
  visitorsExcpetUser$ = this.ngrxStore.select(VISITORS_EXCEPT_USER);
  currentApplicationWorkspace$ = this.ngrxStore.select(
    APPLICATION_WORKSPACE,
  );
  services$ = this.ngrxStore.select(SERVICES);
  editMode$ = this.ngrxStore.select(EDIT_MODE);
  roleInWorkspace$ = this.ngrxStore.select(ROLE_IN_CURRENT_WORKSPACE);
  userIsOwner$ = this.ngrxStore.select(
    USER_IS_OWNER_IN_CURRENT_WORKSPACE,
  );
  user$ = this.ngrxStore.select(USER);
  memberOfGroup$ = this.ngrxStore.select(IS_MEMBER_OF_SELECTED_GROUP);
  workspaceInitialized$ = this.ngrxStore.select(ASSETS_LOADED);
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

  // Local variables
  user: User;
  currentApplicationWorkspace: ApplicationWorkspace;
  measureCatalog: MeasureCatalog;
  selectedService: ServiceInformation;
  selectedServiceName: string;
  successModel: SuccessModel;
  communityWorkspace: CommunityWorkspace = {};
  workspaceOwner: string;
  numberOfRequirements = 0;
  checked: boolean;

  serviceSelectForm = new FormControl('');

  constructor(
    private dialog: MatDialog,
    private translate: TranslateService,
    private workspaceService: WorkspaceService,
    private ngrxStore: Store,
  ) {}

  ngOnInit(): void {
    let sub = this.selectedService$
      .pipe(filter((service) => service !== undefined))
      .subscribe((service) => {
        this.selectedService = service;
        this.selectedServiceName = service.name;
        // this is used so that the initial success model is fetched. We should rather use a new effect for this
        this.serviceSelectForm.setValue(
          service.alias ? service.alias : this.selectedServiceName,
        ); // set the value in the selection
      });
    this.subscriptions$.push(sub);
    sub = this.editMode$
      .pipe(withLatestFrom(this.selectedGroup$))
      .subscribe(async ([editMode, group]) => {
        if (editMode) {
          await this.initWorkspace(group.id);
          this.onSwitchWorkspace(
            this.user?.profile.preferred_username,
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
    sub = this.currentApplicationWorkspace$.subscribe(
      (currentApplicationWorkspace) => {
        this.currentApplicationWorkspace = cloneDeep(
          currentApplicationWorkspace,
        );
      },
    );
    this.subscriptions$.push(sub);
  }

  onServiceSelected(service: ServiceInformation) {
    this.workspaceService.removeWorkspace(
      this.user?.profile.preferred_username,
      this.selectedServiceName,
    );
    this.ngrxStore.dispatch(disableEdit());
    this.ngrxStore.dispatch(setService({ service }));
  }

  async onEditModeChanged() {
    if (this.checked) {
      const result = await this.openClearWorkspaceDialog();
      if (result) {
        this.ngrxStore.dispatch(toggleEdit());
      } else {
        this.checked = true;
      }
    } else {
      this.ngrxStore.dispatch(toggleEdit());
    }
  }

  /**
   * Initializes the workspace for collaborative success modeling
   */
  private async initWorkspace(groupID: string) {
    if (!this.user) return console.error('user cannot be null');
    this.workspaceOwner = this.user?.profile.preferred_username;
    // get the current workspace state from yjs
    if (!this.measureCatalog) {
      this.measureCatalog = new MeasureCatalog({});
    }
    if (!this.successModel) {
      this.successModel = SuccessModel.emptySuccessModel(
        this.selectedService,
      );
    }

    this.currentApplicationWorkspace =
      await this.workspaceService.initWorkspace(
        groupID,
        this.workspaceOwner,
        this.selectedService,
        this.measureCatalog,
        this.successModel,
      );
    return true;
  }

  /**
   * Switch the workspace to that of another user
   * @param owner the owner of the workspace which we want to view
   */
  onSwitchWorkspace(owner: string) {
    this.workspaceOwner = owner;
    this.currentApplicationWorkspace =
      this.workspaceService.switchWorkspace(
        this.workspaceOwner,
        this.selectedServiceName,
        this.user.profile.preferred_username,
      );
    this.ngrxStore.dispatch(setWorkSpaceOwner({ username: owner }));
  }

  onChangeRole(visitorName: string, role?: string) {
    console.log(role, UserRole[role], visitorName);
    this.currentApplicationWorkspace =
      this.workspaceService.changeVisitorRole(
        visitorName,
        this.workspaceOwner,
        this.selectedServiceName,
        role,
      );
  }

  openCopyWorkspaceDialog(owner: string) {
    const message = this.translate.instant(
      'success-modeling.copy-workspace-prompt',
    );
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      minWidth: 300,
      data: message,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.currentApplicationWorkspace =
          this.workspaceService.copyWorkspace(
            owner,
            this.user?.profile.preferred_username,
            this.selectedServiceName,
          );
      }
    });
  }

  private openClearWorkspaceDialog() {
    // only open this dialog if a user is logged in, because else the user's workspace should not be removed anyway
    if (this.user) {
      const message = this.translate.instant(
        'success-modeling.discard-changes-prompt',
      );
      const dialogRef = this.dialog.open(
        ConfirmationDialogComponent,
        {
          minWidth: 300,
          data: message,
        },
      );
      dialogRef.afterClosed().subscribe((result) => {
        if (result) {
          this.workspaceService.removeWorkspace(
            this.user?.profile.preferred_username,
            this.selectedServiceName,
          );
        }
      });
      return dialogRef.afterClosed().toPromise();
    }
  }

  ngOnDestroy() {
    this.subscriptions$.forEach((subscription) => {
      subscription.unsubscribe();
    });
    this.workspaceService.removeWorkspace(
      this.user?.profile.preferred_username,
      this.selectedServiceName,
    );
  }
}
