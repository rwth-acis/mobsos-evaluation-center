import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  ApplicationWorkspace,
  CommunityWorkspace,
  GroupInformation,
  ServiceCollection,
  StoreService,
  Visitor,
} from '../store.service';
import { Las2peerService, Questionnaire } from '../las2peer.service';
import { SuccessModel } from '../../success-model/success-model';
import { MeasureCatalog } from '../../success-model/measure-catalog';
import { NGXLogger } from 'ngx-logger';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { isArray } from 'util';
import { cloneDeep } from 'lodash';


@Component({
  selector: 'app-success-modeling',
  templateUrl: './success-modeling.component.html',
  styleUrls: ['./success-modeling.component.scss'],
})
export class SuccessModelingComponent implements OnInit, OnDestroy {
  groupID;
  services = [];
  serviceMap: ServiceCollection = {};
  selectedService: string;
  measureCatalogXml: Document;
  measureCatalog: MeasureCatalog;
  successModelXml: Document;
  successModel: SuccessModel=undefined;
  editMode = false;
  communityWorkspace: CommunityWorkspace;
  user;
  workspaceUser;
  myGroups: GroupInformation[];
  saveInProgress = false;
  availableQuestionnaires: Questionnaire[];
  numberOfRequirements = 0;

  constructor(
    private store: StoreService,
    private las2peer: Las2peerService,
    private logger: NGXLogger,
    private dialog: MatDialog,
    private translate: TranslateService,
    private snackBar: MatSnackBar
  ) {}

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

  getCurrentGroupName(){
    const currentGroup = this.myGroups.find((group=>group.id==this.groupID))
    
   return currentGroup?currentGroup.name : "Default";
  }

  parseModel(xml: Document) {
    try {
      return SuccessModel.fromXml(xml.documentElement);
    } catch (e) {
      this.logger.warn(e);
    }
  }

  ngOnInit() {
    this.store.startPolling();
    this.store.selectedGroup.subscribe((groupID) => {
      if (groupID) {
        this.groupID = groupID;
      } 
      
      this.successModel = this.successModelXml = this.measureCatalog = this.measureCatalogXml = undefined;
      this.fetchXml();
    });
    this.store.selectedService.subscribe((serviceID) => {
      this.selectedService = serviceID;
      this.fetchXml();
    });
    this.store.services.subscribe((services) => {
      this.services = Object.keys(services);
      this.serviceMap = services;
    });
    this.store.user.subscribe((user) => {
      this.user = user;
      if (!this.user && this.editMode) {
        this.store.setEditMode(false);
      }
    });
    this.store.communityWorkspace.subscribe(async (workspace) => {
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
        this.snackBar.open('Owner closed workspace', null, { duration: 3000 });
      }
    });
    this.store.editMode.subscribe((editMode) => {
      if (editMode && this.user) {
        this.initWorkspace().then(() =>
          this.switchWorkspace(this.getMyUsername())
        );
      } else if (this.editMode === true) {
        this.fetchXml();
        this.openClearWorkspaceDialog();
      }
      this.editMode = editMode;
    });
    this.store.groups.subscribe((groups) => {
      const allGroups = Object.values(groups);
      this.myGroups = allGroups.filter((group) => group.member).sort();
    });
    this.store.questionnaires.subscribe((questionnaires) => {
      questionnaires.sort((a, b) => (a.name > b.name ? 1 : -1));
      this.availableQuestionnaires = questionnaires;
    });
  }

  ngOnDestroy(): void {
    this.store.stopPolling();
  }

  onServiceSelected(service) {
    this.store.setEditMode(false);
    this.cleanData();
    this.store.selectedServiceSubject.next(service);
  }

  async fetchXml() {
    if (this.groupID) {
      this.las2peer
        .fetchMeasureCatalog(this.groupID)
        .then((xml) => {
          if (!xml) {
            xml = '';
          }
          this.measureCatalogXml = SuccessModelingComponent.parseXml(xml);
          this.measureCatalog = this.parseCatalog(this.measureCatalogXml);
        })
        .catch(() => {
          this.measureCatalogXml = null;
          this.measureCatalog = null;
        });
      if (this.selectedService) {
        const setServiceXml = (xml) => {
          if (!xml) {
            xml = '';
          }
          this.successModelXml = SuccessModelingComponent.parseXml(xml);
          this.successModel = this.parseModel(this.successModelXml);
        };
        this.las2peer
          .fetchSuccessModel(this.groupID, this.selectedService)
          .then(setServiceXml)
          .catch(() => {
            this.successModelXml = null;
            this.successModelXml = null;
          });
      }
    }
  }

  onEditModeChanged() {
    this.store.setEditMode(!this.editMode);
  }

  getAllWorkspacesForCurrentService(): ApplicationWorkspace[] {
    const result = [];
    if (!this.selectedService) {
      return [];
    }
    const userWorkspaces = Object.values(this.communityWorkspace);
    for (const userWorkspace of userWorkspaces) {
      if (Object.keys(userWorkspace).includes(this.selectedService)) {
        result.push(userWorkspace[this.selectedService]);
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
    this.workspaceUser = user;
    const visitors = this.getCurrentWorkspace().visitors;
    const myUsername = this.getMyUsername();
    const meAsVisitorArr = visitors.filter(
      (visitor) => visitor.username === myUsername
    );
    if (meAsVisitorArr.length === 0 && this.workspaceUser !== myUsername) {
      visitors.push({ username: myUsername, role: 'spectator' });
      visitors.sort((a, b) => (a.username > b.username ? 1 : -1));
      this.persistWorkspaceChanges();
    }
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

  isMemberOfSelectedGroup(): boolean {
    const searchResult = this.myGroups.filter(
      (value) => value.id === this.groupID
    );
    return searchResult.length > 0;
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

  async onSaveClicked() {
    const workspace = this.getCurrentWorkspace();
    const catalog = MeasureCatalog.fromPlainObject(workspace.catalog);
    const measureXml = catalog.toXml();
    const model = SuccessModel.fromPlainObject(workspace.model);
    const successModelXml = model.toXml();
    this.saveInProgress = true;
    try {
      await this.las2peer.saveMeasureCatalog(
        this.groupID,
        measureXml.outerHTML
      );
      await this.las2peer.saveSuccessModel(
        this.groupID,
        this.selectedService,
        successModelXml.outerHTML
      );
      const message = await this.translate
        .get('success-modeling.snackbar-save-success')
        .toPromise();
      this.snackBar.open(message, null, {
        duration: 2000,
      });
    } catch (e) {
      let message = await this.translate
        .get('success-modeling.snackbar-save-failure')
        .toPromise();
      message += e;
      this.snackBar.open(message, "Ok", {
        duration: 2000,
      });
    }
    this.saveInProgress = false;
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
      this.selectedService
    );
  }

  private getMyUsername() {
    if (!this.user) {
      return null;
    }
    return this.user.profile.preferred_username;
  }

  private async initWorkspace() {
    await this.store.waitUntilWorkspaceIsSynchronized().then(() => {
      const myUsername = this.getMyUsername();
      this.workspaceUser = myUsername;
      if (!Object.keys(this.communityWorkspace).includes(myUsername)) {
        this.communityWorkspace[myUsername] = {};
      }
      const userWorkspace = this.communityWorkspace[myUsername];
      if (!Object.keys(userWorkspace).includes(this.selectedService)) {
        if (!this.measureCatalog) {
          this.measureCatalog = new MeasureCatalog({});
        }
        if (!this.successModel) {
          this.successModel = new SuccessModel(
            this.serviceMap[this.selectedService].alias,
            this.selectedService,
            {
              'System Quality': [],
              'Information Quality': [],
              Use: [],
              'User Satisfaction': [],
              'Individual Impact': [],
              'Community Impact': [],
            },
            [],
            null
          );
        }
        userWorkspace[this.selectedService] = {
          createdAt: new Date().toISOString(),
          createdBy: myUsername,
          visitors: [],
          catalog: this.measureCatalog,
          model: this.successModel,
        };
      }
      this.persistWorkspaceChanges();
    });
  }

  private persistWorkspaceChanges() {
    this.logger.debug(
      'Workspace changed: ' + JSON.stringify(this.communityWorkspace)
    );
    this.store.setCommunityWorkspace(this.communityWorkspace);
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
    const myUsername = this.user.profile.preferred_username;
    if (!Object.keys(this.communityWorkspace).includes(myUsername)) {
      return;
    }
    const userWorkspace = this.communityWorkspace[myUsername];
    if (!Object.keys(userWorkspace).includes(this.selectedService)) {
      return;
    }
    delete userWorkspace[this.selectedService];
    this.persistWorkspaceChanges();
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
      this.selectedService
    );
    const ownerWorkspace = this.getWorkspaceByUserAndService(
      owner,
      this.selectedService
    );
    if (!myWorkspace || !ownerWorkspace) {
      return;
    }
    myWorkspace.catalog = cloneDeep(ownerWorkspace.catalog);
    myWorkspace.model = cloneDeep(ownerWorkspace.model);
    this.persistWorkspaceChanges();
  }
}
