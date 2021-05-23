import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  ApplicationWorkspace,
  CommunityWorkspace,
  GroupInformation,
  ServiceInformation,
  StoreService,
  Visitor,
} from '../store.service';
import { Questionnaire } from '../las2peer.service';

import { MeasureCatalog } from '../../success-model/measure-catalog';
import { NGXLogger } from 'ngx-logger';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';

import { TranslateService } from '@ngx-translate/core';
import { isArray } from 'util';
import { cloneDeep } from 'lodash';
import { Store } from '@ngrx/store';
import {
  disableEdit,
  failureResponse,
  PostActions,
  saveModelAndCatalog,
  setService,
  toggleEdit,
} from '../services/store.actions';
import {
  EDIT_MODE,
  IS_MEMBER_OF_SELECTED_GROUP,
  MEASURE_CATALOG,
  SELECTED_GROUP,
  SELECTED_SERVICE,
  SERVICES,
  SUCCESS_MODEL,
  USER,
  USER_GROUPS,
  WORKSPACE_INITIALIZED,
} from '../services/store.selectors';
import { MeasureCatalog as Catalog } from '../models/measure.catalog';
import { catchError, filter, map, timeout } from 'rxjs/operators';
import { iconMap, translationMap } from './config';
import { SuccessModel } from '../models/success.model';
import { StateEffects } from '../services/store.effects';
import { combineLatest, of, Subscription } from 'rxjs';
import { FormControl } from '@angular/forms';
import { animate, style, transition, trigger } from '@angular/animations';
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
        animate('500ms ease-in', style({ transform: 'translateY(0%)' })),
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ transform: 'translateY(100%)' })),
      ]),
    ]),
  ],
})
export class SuccessModelingComponent implements OnInit, OnDestroy {
  groupID;
  services = [];
  editMode$ = this.ngrxStore.select(EDIT_MODE);
  editMode = false;
  services$ = this.ngrxStore.select(SERVICES);
  successModel$ = this.ngrxStore.select(SUCCESS_MODEL);
  measureCatalog$ = this.ngrxStore.select(MEASURE_CATALOG);
  selectedService$ = this.ngrxStore.select(SELECTED_SERVICE);
  selectedGroup$ = this.ngrxStore.select(SELECTED_GROUP);
  workspaceInitialized$ = this.ngrxStore.select(WORKSPACE_INITIALIZED);
  userGroups$ = this.ngrxStore.select(USER_GROUPS);
  user$ = this.ngrxStore.select(USER);
  memberOfGroup$ = this.ngrxStore.select(IS_MEMBER_OF_SELECTED_GROUP);
  showEditButton$ = combineLatest([
    this.selectedGroup$,
    this.selectedService$,
    this.workspaceInitialized$,
  ]).pipe(map(([group, service, init]) => !!group && !!service && init));
  selectedServiceName: string;
  initialServiceName;

  measureCatalogXml: Document;
  measureCatalog: MeasureCatalog;
  catalog: Catalog;
  translationMap;
  iconMap;
  successModelXml: Document;
  successModel: SuccessModel = undefined;
  selectedService;
  serviceSelectForm = new FormControl('');

  communityWorkspace: CommunityWorkspace;
  user;
  dimensions;
  workspaceUser;
  myGroups: GroupInformation[];
  saveInProgress = false;
  availableQuestionnaires: Questionnaire[];
  numberOfRequirements = 0;

  subscriptions$: Subscription[] = [];

  constructor(
    private store: StoreService,
    private logger: NGXLogger,
    private dialog: MatDialog,
    private translate: TranslateService,
    private snackBar: MatSnackBar,
    private ngrxStore: Store,
    private actionState: StateEffects
  ) {
    this.translationMap = translationMap;
    this.iconMap = iconMap;
    this.dimensions = Object.keys(translationMap);
  }

  static parseXml(xml) {
    const parser = new DOMParser();
    return parser.parseFromString(xml, 'text/xml');
  }

  parseCatalog(xml: Document): MeasureCatalog {
    try {
      return MeasureCatalog.fromXml(xml.documentElement);
    } catch (e) {
      this.logger.warn(e);
    }
  }

  getCurrentGroupName() {
    const currentGroup = this.myGroups.find(
      (group) => group.id == this.groupID
    );
    return currentGroup ? currentGroup.name : '';
  }

  parseModel(xml: Document) {
    try {
      return SuccessModel.fromXml(xml.documentElement);
    } catch (e) {
      this.logger.warn(e);
    }
  }

  ngOnInit() {
    let sub = this.selectedService$
      .pipe(filter((service) => service !== undefined))
      .subscribe((service) => {
        this.selectedServiceName = service.alias ? service.alias : service.name;
        this.ngrxStore.dispatch(setService({ service }));
        if (!this.initialServiceName) {
          this.initialServiceName = this.selectedServiceName;
          this.serviceSelectForm.setValue(this.selectedServiceName);
        }
      });
    this.subscriptions$.push(sub);

    sub = this.measureCatalog$.subscribe((catalog) => (this.catalog = catalog));
    this.subscriptions$.push(sub);
    sub = this.userGroups$.subscribe((groups) => (this.myGroups = groups));
    this.subscriptions$.push(sub);

    sub = this.user$.subscribe((user) => (this.user = user));
    this.subscriptions$.push(sub);
    sub = this.services$.subscribe((services) => (this.services = services));
    this.subscriptions$.push(sub);
    sub = this.successModel$.subscribe(
      (successModel) =>
        (this.successModel = successModel
          ? successModel
          : SuccessModel.emptySuccessModel(this.selectedService))
    );
    this.subscriptions$.push(sub);
    sub = this.selectedService$.subscribe(
      (service) => (this.selectedService = service)
    );
    this.subscriptions$.push(sub);
    sub = this.store.communityWorkspace
      .pipe(filter((workspace) => !!workspace))
      .subscribe(async (workspace) => {
        this.communityWorkspace = workspace;
        if (
          this.workspaceUser &&
          this.workspaceUser !== this.getMyUsername() &&
          this.getCurrentWorkspace() === null
        ) {
          this.initWorkspace().then(() =>
            this.switchWorkspace(this.getMyUsername())
          );
          const message = await this.translate
            .get('success-modeling.workspace-closed-message')
            .toPromise();
          this.snackBar.open('Owner closed workspace', null, {
            duration: 3000,
          });
        }
      });
    this.subscriptions$.push(sub);
    sub = this.editMode$.subscribe((editMode) => {
      if (editMode && this.user) {
        this.initWorkspace().then(() =>
          this.switchWorkspace(this.getMyUsername())
        );
      } else if (this.editMode) {
        this.openClearWorkspaceDialog();
      }
      this.editMode = editMode;
    });
    this.subscriptions$.push(sub);
  }

  ngOnDestroy(): void {
    this.store.stopPolling();
    this.subscriptions$.forEach((sub) => sub.unsubscribe());
  }

  onServiceSelected(service: ServiceInformation) {
    this.store.setEditMode(false);

    // Make popup here to ask if user really wants to cancel editing
    this.ngrxStore.dispatch(disableEdit());

    this.ngrxStore.dispatch(setService({ service }));
  }

  onEditModeChanged() {
    this.ngrxStore.dispatch(toggleEdit());
    this.store.setEditMode(!this.editMode);
  }

  getAllWorkspacesForCurrentService(): ApplicationWorkspace[] {
    const result = [];
    if (!this.selectedServiceName) {
      return [];
    }
    const userWorkspaces = Object.values(this.communityWorkspace);
    for (const userWorkspace of userWorkspaces) {
      if (Object.keys(userWorkspace).includes(this.selectedServiceName)) {
        result.push(userWorkspace[this.selectedServiceName]);
      }
    }
    return result;
  }

  getAllWorkspacesForCurrentServiceExceptActive() {
    return this.getAllWorkspacesForCurrentService().filter(
      (workspace) => workspace.createdBy !== this.workspaceUser
    );
  }

  getNumberOfOpenWorkspacesFromOtherUsers(): number {
    const myUsername = this.getMyUsername();
    return this.getAllWorkspacesForCurrentService().filter(
      (workspace) => workspace.createdBy !== myUsername
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
    if (workspace == null || !isArray(workspace.visitors)) {
      return [];
    }
    return workspace.visitors;
  }

  getCurrentVisitorsExceptMe(): Visitor[] {
    const visitors = this.getCurrentVisitors();
    return visitors.filter(
      (visitor) => visitor.username !== this.getMyUsername()
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
      (visitor) => visitor.username === visitorName
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
      (visitor) => visitor.username === myUsername
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

  getMeasureCatalog(): MeasureCatalog {
    if (this.editMode) {
      const workspace = this.getCurrentWorkspace();
      if (!workspace) {
        return null;
      }
      return workspace.catalog;
    } else {
      return this.measureCatalog;
    }
  }

  getSuccessModel(): SuccessModel {
    if (this.editMode) {
      const workspace = this.getCurrentWorkspace();
      if (!workspace) {
        return undefined;
      }
      return workspace.model;
    } else {
      return this.successModel;
    }
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
      let sub = this.actionState.saveModelAndCatalog$
        .pipe(
          timeout(300000),
          catchError(() => {
            return of(
              failureResponse({
                reason: new Error('The request took too long and was aborted'),
              })
            );
          })
        )
        .subscribe((result) => {
          this.saveInProgress = false;

          console.log(result);

          if (result && result instanceof failureResponse) {
            let message =
              this.translate.instant('success-modeling.snackbar-save-failure') +
              (result as { reason: Error }).reason.message;

            this.snackBar.open(message, 'Ok');
          } else {
            let message = this.translate.instant(
              'success-modeling.snackbar-save-success'
            );
            this.snackBar.open(message, null, {
              duration: 2000,
            });
          }
          sub.unsubscribe();
        });
    }

    // const workspace = this.getCurrentWorkspace();
    // const catalog = MeasureCatalog.fromPlainObject(workspace.catalog);
    // const measureXml = catalog.toXml();
    // const model = SuccessModel.fromPlainObject(workspace.model);
    // const successModelXml = model.toXml();
    // this.saveInProgress = true;
    // try {
    //   await this.las2peer.saveMeasureCatalog(
    //     this.groupID,
    //     measureXml.outerHTML
    //   );
    //   await this.las2peer.saveSuccessModel(
    //     this.groupID,
    //     this.selectedServiceName,
    //     successModelXml.outerHTML
    //   );
    //   const message = await this.translate
    //     .get('success-modeling.snackbar-save-success')
    //     .toPromise();
    //   this.snackBar.open(message, null, {
    //     duration: 2000,
    //   });
    // } catch (e) {
    //   let message = await this.translate
    //     .get('success-modeling.snackbar-save-failure')
    //     .toPromise();
    //   message += e;
    //   this.snackBar.open(message, 'Ok', {
    //     duration: 2000,
    //   });
    // }
    // this.saveInProgress = false;
  }

  private getWorkspaceByUserAndService(
    user: string,
    service: string
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
      this.selectedServiceName
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

  private async initWorkspace() {
    // this.store.waitUntilWorkspaceIsSynchronized().then(() => {
    //   const myUsername = this.getMyUsername();
    //   this.workspaceUser = myUsername;
    //   if (!Object.keys(this.communityWorkspace).includes(myUsername)) {
    //     this.communityWorkspace[myUsername] = {};
    //   }
    //   const userWorkspace = this.communityWorkspace[myUsername];
    //   if (!Object.keys(userWorkspace).includes(this.selectedServiceName)) {
    //     if (!this.measureCatalog) {
    //       this.measureCatalog = new MeasureCatalog({});
    //     }
    //     if (!this.successModel) {
    //       this.successModel = new SuccessModel(
    //         this.selectedService.alias,
    //         this.selectedService.name,
    //         {
    //           'System Quality': [],
    //           'Information Quality': [],
    //           Use: [],
    //           'User Satisfaction': [],
    //           'Individual Impact': [],
    //           'Community Impact': [],
    //         },
    //         [],
    //         null
    //       );
    //     }
    //     const appworkspace = {
    //       createdAt: new Date().toISOString(),
    //       createdBy: myUsername,
    //       visitors: [],
    //       catalog: this.measureCatalog,
    //       model: this.successModel,
    //     };
    //     userWorkspace[this.selectedServiceName] = appworkspace;
    //     this.ngrxStore.dispatch(
    //       updateAppWorkspace({ workspace: appworkspace })
    //     );
    //   }
    //   this.persistWorkspaceChanges();
    // });
  }

  private persistWorkspaceChanges() {
    // this.logger.debug(
    //   'Workspace changed: ' + JSON.stringify(this.communityWorkspace)
    // );
    // this.store.setCommunityWorkspace(this.communityWorkspace);
  }

  private async openClearWorkspaceDialog() {
    // only open this dialog if a user is logged in, because else the user's workspace should not be removed anyway
    if (this.user) {
      const message = await this.translate
        .get('success-modeling.discard-changes-prompt')
        .toPromise();
      const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
        minWidth: 300,
        data: message,
      });
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

  private cleanData() {
    this.successModelXml = null;
    this.successModel = undefined;
    this.workspaceUser = this.getMyUsername();
  }

  private copyWorkspace(owner: string) {
    const myUsername = this.getMyUsername();
    if (!Object.keys(this.communityWorkspace).includes(myUsername)) {
      return;
    }
    const myWorkspace = this.getWorkspaceByUserAndService(
      myUsername,
      this.selectedServiceName
    );
    const ownerWorkspace = this.getWorkspaceByUserAndService(
      owner,
      this.selectedServiceName
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
