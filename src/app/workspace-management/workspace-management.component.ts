import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';

import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import {
  disableEdit,
  joinWorkSpace,
  setService,
  toggleEdit,
} from '../services/store.actions';

import { cloneDeep } from 'lodash-es';
import { User } from '../models/user.model';
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
  WORKSPACE_OWNER,
} from '../services/store.selectors';
import { combineLatest, Subscription } from 'rxjs';
import {
  filter,
  first,
  map,
  takeWhile,
  withLatestFrom,
} from 'rxjs/operators';
import { WorkspaceService } from '../services/workspace.service';
import { SuccessModel } from '../models/success.model';
import { MeasureCatalog } from '../models/measure.catalog';
import { ServiceInformation } from '../models/service.model';
import { ApplicationWorkspace } from '../models/workspace.model';
import { GroupInformation } from '../models/community.model';
import { MatSnackBar } from '@angular/material/snack-bar';

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
  applicationWorkspaceOwner$ = this.ngrxStore.select(WORKSPACE_OWNER);
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
  workspaceOwner: string;
  numberOfRequirements = 0;
  checked: boolean;
  serviceSelectForm = new FormControl('');
  selectedGroup: GroupInformation;

  constructor(
    private _snackBar: MatSnackBar,
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
      .pipe(
        withLatestFrom(
          this.selectedGroup$,
          this.applicationWorkspaceOwner$,
        ),
      )
      .subscribe(async ([editMode, group, owner]) => {
        this.selectedGroup = group;
        if (editMode) {
          if (
            owner &&
            owner !== this.user?.profile.preferred_username
          ) {
            this.ngrxStore.dispatch(
              joinWorkSpace({
                groupId: group.id,
                serviceName: this.selectedServiceName,
                owner,
                username: this.user.profile.preferred_username,
              }),
            );
          } else {
            this.initWorkspace(group.id);
            this.ngrxStore.dispatch(
              joinWorkSpace({
                groupId: group.id,
                serviceName: this.selectedServiceName,
                owner,
                username: this.user.profile.preferred_username,
              }),
            );
          }
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

    sub = this.ngrxStore
      .select(WORKSPACE_OWNER)
      .subscribe((owner) => {
        this.workspaceOwner = owner;
      });
    this.subscriptions$.push(sub);
    sub = this.editMode$.pipe(first()).subscribe((mode) => {
      if (mode !== this.checked) this.checked = mode;
    });
    this.subscriptions$.push(sub);
  }

  async onServiceSelected(service: ServiceInformation) {
    const confirmation = await this.openClearWorkspaceDialog();
    if (confirmation) {
      this.workspaceService.removeWorkspace(
        this.user?.profile.preferred_username,
        this.selectedServiceName,
      );
      this.ngrxStore.dispatch(disableEdit());
      this.ngrxStore.dispatch(setService({ service }));
    }
  }

  onEditModeChanged() {
    this.ngrxStore.dispatch(toggleEdit());
  }

  /**
   * Switch the workspace to that of another user
   * @param owner the owner of the workspace which we want to view
   */
  onSwitchWorkspace(owner: string) {
    this.ngrxStore.dispatch(
      joinWorkSpace({
        groupId: this.selectedGroup.id,
        serviceName: this.selectedServiceName,
        owner,
        username: this.user.profile.preferred_username,
      }),
    );
  }

  onChangeRole(visitorName: string, role?: string) {
    this.currentApplicationWorkspace =
      this.workspaceService.changeVisitorRole(
        visitorName,
        this.workspaceOwner,
        this.selectedServiceName,
        role,
      );
  }

  shareWorkspaceLink() {
    if (this.selectedGroup && this.selectedService && this.user) {
      const link =
        window.location.href +
        'join/' +
        this.selectedGroup.id +
        '/' +
        this.selectedService.name +
        '/' +
        this.user.profile.preferred_username;
      navigator.clipboard.writeText(link);
      const message = this.translate.instant('copied-to-clipboard');
      this._snackBar.open(message, null, { duration: 3000 });
    }
  }

  openCopyWorkspaceDialog(owner: string) {
    const message = this.translate.instant(
      'success-modeling.copy-workspace-prompt',
    );
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      minWidth: 300,
      data: message,
    });
    const sub = dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.currentApplicationWorkspace =
          this.workspaceService.copyWorkspace(
            owner,
            this.user?.profile.preferred_username,
            this.selectedServiceName,
          );
      }
      sub.unsubscribe();
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
      return dialogRef.afterClosed().toPromise();
    }
  }

  /**
   * Initializes the workspace for collaborative success modeling
   */
  private initWorkspace(groupID: string) {
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

    this.workspaceService.initWorkspace(
      groupID,
      this.workspaceOwner,
      this.selectedService,
      this.measureCatalog,
      this.successModel,
    );
    this.currentApplicationWorkspace =
      this.workspaceService.currentCommunityWorkspace[
        this.workspaceOwner
      ][this.selectedService.name];
    return true;
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
