import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';

import { ConfirmationDialogComponent } from '../../shared/confirmation-dialog/confirmation-dialog.component';
import {
  disableEdit,
  enableEdit,
  joinWorkSpace,
  setService,
} from '../../services/store.actions';

import { User } from '../../models/user.model';
import {
  ALL_WORKSPACES_FOR_SELECTED_SERVICE_EXCEPT_ACTIVE,
  EDIT_MODE,
  IS_MEMBER_OF_SELECTED_GROUP,
  MEASURE_CATALOG,
  ROLE_IN_CURRENT_WORKSPACE,
  SELECTED_GROUP,
  SELECTED_SERVICE,
  _SERVICES,
  SUCCESS_MODEL,
  USER,
  USER_IS_OWNER_IN_CURRENT_WORKSPACE,
  APPLICATION_WORKSPACE,
  MODEL_AND_CATALOG_LOADED,
  WORKSPACE_OWNER,
  SELECTED_WORKSPACE_OWNER,
  _SELECTED_SERVICE_NAME,
  _SELECTED_GROUP_ID,
  NUMBER_OF_REQUIREMENTS,
  VISITORS,
} from '../../services/store.selectors';
import { combineLatest, Subscription } from 'rxjs';
import {
  distinctUntilChanged,
  filter,
  map,
  take,
  withLatestFrom,
} from 'rxjs/operators';

import { WorkspaceService } from '../../services/workspace.service';
import { ServiceInformation } from '../../models/service.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { joinAbsoluteUrlPath } from '../../services/las2peer.service';

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
  visitors$ = this.ngrxStore.select(VISITORS);
  currentApplicationWorkspace$ = this.ngrxStore.select(
    APPLICATION_WORKSPACE,
  );
  services$ = this.ngrxStore.select(_SERVICES);
  editMode$ = this.ngrxStore.select(EDIT_MODE);
  roleInWorkspace$ = this.ngrxStore.select(ROLE_IN_CURRENT_WORKSPACE);
  userIsOwner$ = this.ngrxStore.select(
    USER_IS_OWNER_IN_CURRENT_WORKSPACE,
  );
  selectedOwner$ = this.ngrxStore.select(SELECTED_WORKSPACE_OWNER); // holds the owner of the workspace which the user wants to join
  applicationWorkspaceOwner$ = this.ngrxStore.select(WORKSPACE_OWNER); // holds the owner of the current workspace object
  user$ = this.ngrxStore.select(USER);
  numberOfRequirements$ = this.ngrxStore
    .select(NUMBER_OF_REQUIREMENTS)
    .pipe(map((n) => (n === 0 ? null : n)));
  memberOfGroup$ = this.ngrxStore.select(IS_MEMBER_OF_SELECTED_GROUP);
  workspaceInitialized$ = this.ngrxStore.select(
    MODEL_AND_CATALOG_LOADED,
  );
  selectedService$ = this.ngrxStore.select(SELECTED_SERVICE);
  selectedGroup$ = this.ngrxStore.select(SELECTED_GROUP);
  showWorkSpaceManagementControls$ = combineLatest([
    this.selectedGroup$,
    this.selectedService$,
  ]).pipe(
    map(([group, service]) => !!group && !!service),
    distinctUntilChanged(),
  );

  subscriptions$: Subscription[] = [];

  // Local variables
  user: User;
  workspaceOwner: string;
  numberOfRequirements = 0;
  checked: boolean;
  // these variables represent what the user has selected, not necessarily the current state
  selectedService: ServiceInformation;
  selectedGroupId: string;
  editMode: boolean;

  constructor(
    private _snackBar: MatSnackBar,
    private dialog: MatDialog,
    private translate: TranslateService,
    private workspaceService: WorkspaceService,
    private ngrxStore: Store,
  ) {}

  async ngOnInit(): Promise<void> {
    let sub = this.selectedService$
      .pipe(filter((service) => !!service))
      .subscribe((service) => {
        this.selectedService = service;
      });
    this.subscriptions$.push(sub);

    sub = this.ngrxStore
      .select(_SELECTED_GROUP_ID)
      .subscribe((groupId) => {
        this.selectedGroupId = groupId;
      });
    this.subscriptions$.push(sub);
    sub = this.user$.subscribe((user) => {
      this.user = user;
    });
    this.subscriptions$.push(sub);

    sub = this.ngrxStore
      .select(WORKSPACE_OWNER)
      .subscribe((owner) => {
        this.workspaceOwner = owner;
      });
    this.subscriptions$.push(sub);

    sub = this.ngrxStore
      .select(EDIT_MODE)
      .pipe(
        distinctUntilChanged(),
        filter((mode) => mode),
        withLatestFrom(
          this.ngrxStore.select(_SELECTED_GROUP_ID),
          this.ngrxStore.select(_SELECTED_SERVICE_NAME),
          this.ngrxStore.select(USER),
        ),
      )
      .subscribe(([, groupId, serviceName, user]) => {
        const username = user?.profile.preferred_username;

        const dialogRef = this.dialog.open(
          ConfirmationDialogComponent,
          {
            minWidth: 300,
            width: '80%',
            data: 'Do you want to import the current success model into your workspace? This will overwrite the current workspace',
          },
        );
        void dialogRef
          .afterClosed()
          .toPromise()
          .then((result: boolean) => {
            if (username && serviceName) {
              this.ngrxStore.dispatch(
                joinWorkSpace({
                  groupId,
                  serviceName,
                  username,
                  copyModel: result,
                }),
              );
            }
          });
      });
    this.subscriptions$.push(sub);

    const editMode = await this.editMode$.pipe(take(1)).toPromise();
    if (editMode !== this.checked) this.checked = editMode;
  }

  async onServiceSelected(
    service: ServiceInformation,
  ): Promise<void> {
    const editMode = await this.editMode$.pipe(take(1)).toPromise();

    const confirmation =
      editMode && (await this.openClearWorkspaceDialog()); // only open the dialog if we are in the edit mode
    if (!editMode || confirmation) {
      this.workspaceService.removeWorkspace(
        this.user?.profile.preferred_username,
        this.selectedService?.name,
      );
      this.ngrxStore.dispatch(disableEdit());
      this.ngrxStore.dispatch(setService({ service }));
    }
  }

  async onEditModeToggled(): Promise<void> {
    const editMode = await this.editMode$.pipe(take(1)).toPromise();
    if (editMode) {
      const confirmation = await this.openClearWorkspaceDialog();
      if (confirmation) {
        this.ngrxStore.dispatch(disableEdit());
      }
    } else {
      this.ngrxStore.dispatch(enableEdit());
    }
  }

  /**
   * Switch the workspace to that of another user
   *
   * @param owner the owner of the workspace which we want to view
   */
  onSwitchWorkspace(owner: string): void {
    this.ngrxStore.dispatch(
      joinWorkSpace({
        groupId: this.selectedGroupId,
        serviceName: this.selectedService?.name,
        owner,
        username: this.user.profile.preferred_username,
      }),
    );
  }

  onChangeRole(
    visitorName: string,
    role?: string,
    event?: Event,
  ): void {
    this.workspaceService.changeVisitorRole(
      visitorName,
      this.workspaceOwner,
      this.selectedService?.name,
      role,
    );
    event.stopPropagation();
  }

  shareWorkspaceLink(): void {
    if (this.selectedGroupId && this.selectedService && this.user) {
      const base = window.location.href.split('success-modeling')[0];
      const link = joinAbsoluteUrlPath(
        base,
        'join',
        this.selectedGroupId,
        this.selectedService.name,
        this.user.profile.preferred_username,
      );

      void navigator.clipboard.writeText(link);
      const message = this.translate.instant(
        'copied-to-clipboard',
      ) as string;
      this._snackBar.open(message, null, { duration: 3000 });
    }
  }

  openCopyWorkspaceDialog(owner: string): void {
    const message = this.translate.instant(
      'success-modeling.copy-workspace-prompt',
    ) as string;
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      minWidth: 300,
      data: message,
    });
    const sub = dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.workspaceService.copyWorkspace(
          owner,
          this.user?.profile.preferred_username,
          this.selectedService?.name,
        );
      }
      sub.unsubscribe();
    });
  }

  ngOnDestroy(): void {
    this.subscriptions$.forEach((subscription) => {
      subscription.unsubscribe();
    });
    this.workspaceService.removeWorkspace(
      this.user?.profile.preferred_username,
      this.selectedService?.name,
    );
  }

  private openClearWorkspaceDialog(): Promise<boolean> {
    // only open this dialog if a user is logged in, because else the user's workspace should not be removed anyway
    if (this.user) {
      const message = this.translate.instant(
        'success-modeling.discard-changes-prompt',
      ) as string;
      const dialogRef = this.dialog.open(
        ConfirmationDialogComponent,
        {
          minWidth: 300,
          data: message,
        },
      );
      return dialogRef.afterClosed().toPromise() as Promise<boolean>;
    }
  }
}
