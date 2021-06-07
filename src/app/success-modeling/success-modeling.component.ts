import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  ApplicationWorkspace,
  CommunityWorkspace,
  ServiceInformation,
  StoreService,
  Visitor,
} from '../store.service';
import { Questionnaire } from '../las2peer.service';

import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';

import { TranslateService } from '@ngx-translate/core';
import { cloneDeep } from 'lodash';
import { Store } from '@ngrx/store';
import {
  disableEdit,
  failureResponse,
  PostActions,
  saveModelAndCatalog,
  setService,
  successResponse,
  toggleEdit,
} from '../services/store.actions';
import {
  DIMENSIONS_IN_MODEL,
  EDIT_MODE,
  IS_MEMBER_OF_SELECTED_GROUP,
  MEASURE_CATALOG,
  SELECTED_GROUP,
  SELECTED_SERVICE,
  SERVICES,
  SUCCESS_MODEL,
  USER,
  WORKSPACE_INITIALIZED,
} from '../services/store.selectors';
import {
  catchError,
  distinctUntilChanged,
  filter,
  map,
  tap,
  timeout,
  withLatestFrom,
} from 'rxjs/operators';
import { iconMap, translationMap } from './config';
import { SuccessModel } from '../models/success.model';
import { StateEffects } from '../services/store.effects';
import { combineLatest, of, Subscription } from 'rxjs';
import { FormControl } from '@angular/forms';
import {
  animate,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
@Component({
  selector: 'app-success-modeling',
  templateUrl: './success-modeling.component.html',
  styleUrls: ['./success-modeling.component.scss'],
  animations: [
    trigger('slideInOut', [
      transition(':enter', [
        style({ transform: 'translateY(200%)' }),
        animate(
          '500ms ease-in',
          style({ transform: 'translateY(0%)' }),
        ),
      ]),
      transition(':leave', [
        animate(
          '200ms ease-in',
          style({ transform: 'translateY(100%)' }),
        ),
      ]),
    ]),
  ],
})
export class SuccessModelingComponent implements OnInit, OnDestroy {
  serviceSelectForm = new FormControl('');

  editMode$ = this.ngrxStore.select(EDIT_MODE);
  services$ = this.ngrxStore.select(SERVICES);
  successModel$ = this.ngrxStore.select(SUCCESS_MODEL);
  showSuccessModelEmpty$ = this.ngrxStore
    .select(DIMENSIONS_IN_MODEL)
    .pipe(
      map(
        (dimensions) =>
          dimensions.find((dimension) => dimension.length > 0) ===
          undefined,
      ),
      withLatestFrom(this.editMode$),
      map(([empty, editMode]) => empty && !editMode),
    );
  measureCatalog$ = this.ngrxStore.select(MEASURE_CATALOG);
  selectedService$ = this.ngrxStore.select(SELECTED_SERVICE);
  selectedGroup$ = this.ngrxStore.select(SELECTED_GROUP);
  workspaceInitialized$ = this.ngrxStore.select(
    WORKSPACE_INITIALIZED,
  );
  user$ = this.ngrxStore.select(USER);
  memberOfGroup$ = this.ngrxStore.select(IS_MEMBER_OF_SELECTED_GROUP);
  showEditButton$ = combineLatest([
    this.selectedGroup$,
    this.selectedService$,
    this.workspaceInitialized$,
  ]).pipe(
    map(([group, service, init]) => !!group && !!service && init),
  );

  selectedServiceName: string;
  editMode = false;
  // TODO: use a copy of the success model, which will contain changes the user made.
  // If the user does not save the changes then we reset it to the value from the store
  successModel: SuccessModel;

  dimensions = Object.keys(translationMap);

  translationMap = translationMap; // maps dimensions to their translation keys
  iconMap = iconMap; // maps dimensions to their icons

  communityWorkspace: CommunityWorkspace;
  user;
  workspaceUser;

  saveInProgress = false;
  availableQuestionnaires: Questionnaire[];
  numberOfRequirements = 0;

  subscriptions$: Subscription[] = [];

  constructor(
    private dialog: MatDialog,
    private translate: TranslateService,
    private snackBar: MatSnackBar,
    private ngrxStore: Store,
    private actionState: StateEffects,
  ) {}

  ngOnInit() {
    // this.successModelEmpty$.subscribe((data) => console.log(data));
    let sub = this.selectedService$
      .pipe(filter((service) => service !== undefined))
      .subscribe((service) => {
        this.selectedServiceName = service.alias
          ? service.alias
          : service.name;
        // this is used so that the initial success model is fetched. We should rather use a new effect for this
        this.ngrxStore.dispatch(setService({ service }));
        this.serviceSelectForm.setValue(this.selectedServiceName); // set the value in the selection
      });
    this.subscriptions$.push(sub);

    sub = this.user$.subscribe((user) => (this.user = user));
    this.subscriptions$.push(sub);

    sub = this.successModel$.subscribe((successModel) => {
      this.successModel = successModel;
    });
    this.subscriptions$.push(sub);

    sub = this.editMode$
      .pipe(withLatestFrom(this.successModel$, this.selectedService$))
      .subscribe(([editMode, model, service]) => {
        if (editMode && model === null) {
          // we add a new model so we create an empty one first
          this.successModel = SuccessModel.emptySuccessModel(service);
        } else if (!editMode && model == null) {
          // we disable edit mode without creating any new model
          this.successModel = model;
        }
      });
    this.subscriptions$.push(sub);

    sub = this.editMode$.subscribe((editMode) => {
      if (editMode && this.user) {
        this.initWorkspace().then(() =>
          // this is not working currently
          this.switchWorkspace(this.getMyUsername()),
        );
      }
      this.editMode = editMode;
    });
    this.subscriptions$.push(sub);
  }

  ngOnDestroy(): void {
    this.subscriptions$.forEach((sub) => sub.unsubscribe());
  }

  onServiceSelected(service: ServiceInformation) {
    this.ngrxStore.dispatch(disableEdit());
    this.ngrxStore.dispatch(setService({ service }));
  }

  onEditModeChanged() {
    this.ngrxStore.dispatch(toggleEdit());
  }

  getAllWorkspacesForCurrentService(): ApplicationWorkspace[] {
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
    return this.getAllWorkspacesForCurrentService().filter(
      (workspace) => workspace.createdBy !== this.workspaceUser,
    );
  }

  getNumberOfOpenWorkspacesFromOtherUsers(): number {
    const myUsername = this.getMyUsername();
    return this.getAllWorkspacesForCurrentService().filter(
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

  switchWorkspace(user: string) {
    // this.workspaceUser = user;
    // const visitors = this.getCurrentWorkspace().visitors;
    // const myUsername = this.getMyUsername();
    // const meAsVisitorArr = visitors.filter(
    //   (visitor) => visitor.username === myUsername
    // );
    // if (meAsVisitorArr.length === 0 && this.workspaceUser !== myUsername) {
    //   visitors.push({ username: myUsername, role: 'spectator' });
    //   visitors.sort((a, b) => (a.username > b.username ? 1 : -1));
    //   this.persistWorkspaceChanges();
    // }
  }

  changeVisitorRole(visitorName: string, role: string) {
    const visitors = this.getCurrentWorkspace().visitors;
    const visitorSearchResult = visitors.filter(
      (visitor) => visitor.username === visitorName,
    );
    if (visitorSearchResult) {
      visitorSearchResult[0].role = role;
      this.persistWorkspaceChanges();
    }
  }

  getMyRole(): string {
    const myUsername = this.getMyUsername();
    const workspace = this.getCurrentWorkspace();
    if (!workspace) {
      return null;
    }
    if (workspace.createdBy === myUsername) {
      return 'owner';
    }
    const visitors = workspace.visitors;
    const visitorSearchResult = visitors.filter(
      (visitor) => visitor.username === myUsername,
    );
    if (visitorSearchResult) {
      return visitorSearchResult[0].role;
    }
    return 'spectator';
  }

  canEdit() {
    if (this.editMode) {
      const role = this.getMyRole();
      return role === 'owner' || role === 'editor';
    }
    return false;
  }

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

  onSaveClicked() {
    this.saveInProgress = true;
    this.ngrxStore.dispatch(saveModelAndCatalog());
    if (this.saveInProgress) {
      const sub = this.actionState.saveModelAndCatalog$
        .pipe(
          timeout(300000),
          catchError(() => {
            return of(
              failureResponse({
                reason: new Error(
                  'The request took too long and was aborted',
                ),
              }),
            );
          }),
        )
        .subscribe((result) => {
          this.saveInProgress = false;
          if (result.type === PostActions.SAVE_CATALOG_SUCCESS) {
            const message = this.translate.instant(
              'success-modeling.snackbar-save-success',
            );
            this.snackBar.open(message, null, {
              duration: 2000,
            });
            this.ngrxStore.dispatch(disableEdit());
          } else {
            let message = this.translate.instant(
              'success-modeling.snackbar-save-failure',
            );
            if (result instanceof failureResponse) {
              message += (result as { reason: Error }).reason.message;
            }
            this.snackBar.open(message, 'Ok');
          }
          sub.unsubscribe();
        });
    }
  }

  private getWorkspaceByUserAndService(
    user: string,
    service: string,
  ): ApplicationWorkspace {
    if (!Object.keys(this.communityWorkspace).includes(user)) {
      return null;
    }
    const userWorkspace = this.communityWorkspace[user];
    if (!Object.keys(userWorkspace).includes(service)) {
      return null;
    }
    return userWorkspace[service];
  }

  private getCurrentWorkspace(): ApplicationWorkspace {
    return this.getWorkspaceByUserAndService(
      this.workspaceUser,
      this.selectedServiceName,
    );
  }

  onMeasuresChange(event) {
    // console.log(event);
  }
  onFactorsChange({ factors, dimensionName }) {
    // console.log(factors);
    // // this.successModel.dimensions[dimensionName] = factors;
    // // this.ngrxStore.dispatch(
    // //   storeSuccessModel({ xml: this.successModel.toXml().outerHTML })
    // // );
  }

  private getMyUsername() {
    if (!this.user) {
      return null;
    }
    return this.user.profile.preferred_username;
  }

  private async initWorkspace() {}

  private persistWorkspaceChanges() {}

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

  private removeWorkspace() {
    // const myUsername = this.user.profile.preferred_username;
    // if (!Object.keys(this.communityWorkspace).includes(myUsername)) {
    //   return;
    // }
    // const userWorkspace = this.communityWorkspace[myUsername];
    // if (!Object.keys(userWorkspace).includes(this.selectedServiceName)) {
    //   return;
    // }
    // delete userWorkspace[this.selectedServiceName];
    // this.persistWorkspaceChanges();
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
}
function TypedAction<T>() {
  throw new Error('Function not implemented.');
}
