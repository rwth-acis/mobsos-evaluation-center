import { Component, OnDestroy, OnInit } from '@angular/core';
import { PickReqbazProjectComponent } from './pick-reqbaz-project/pick-reqbaz-project.component';
import { ConfirmationDialogComponent } from '../../../shared/dialogs/confirmation-dialog/confirmation-dialog.component';
import { TranslateService } from '@ngx-translate/core';

import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { Store } from '@ngrx/store';
import {
  REQBAZ_PROJECT,
  REQUIREMENTS,
  SUCCESS_MODEL,
  USER,
} from 'src/app/services/store/store.selectors';
import {
  addReqBazarProject,
  removeReqBazarProject,
  storeRequirements,
} from 'src/app/services/store/store.actions';
import { User } from 'src/app/models/user.model';
import { SuccessModel } from 'src/app/models/success.model';
import {
  ReqbazProject,
  Requirement,
} from 'src/app/models/reqbaz.model';
import {
  joinAbsoluteUrlPath,
  Las2peerService,
} from 'src/app/services/las2peer.service';
import { cloneDeep } from 'lodash-es';
import { firstValueFrom, Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import 'reqbaz-components/reqbaz-requirements-grid';

@Component({
  selector: 'app-requirements',
  templateUrl: './requirements.component.html',
  styleUrls: ['./requirements.component.scss'],
})
export class RequirementsComponent implements OnInit, OnDestroy {
  successModel: SuccessModel;
  successModel$ = this.ngrxStore.select(SUCCESS_MODEL);

  backend = environment.reqBazUrl;
  reqBazProject$ = this.ngrxStore.select(REQBAZ_PROJECT);

  user$ = this.ngrxStore.select(USER);
  requirements$ = this.ngrxStore.select(REQUIREMENTS);
  requirements: Requirement[];
  refreshRequirementsHandle;
  frontendUrl = environment.reqBazFrontendUrl;
  openedRequirement = null;
  private user: User;
  private subscriptions$: Subscription[] = [];

  constructor(
    private dialog: MatDialog,
    private translate: TranslateService,
    private las2peer: Las2peerService,
    private ngrxStore: Store,
  ) {}

  ngOnInit(): void {
    let sub = this.user$.subscribe((user) => (this.user = user));
    this.subscriptions$.push(sub);
    sub = this.successModel$.subscribe((model) => {
      this.successModel = model;
      if (!this.requirements) {
        void this.refreshRequirements();
      }
    });
    this.subscriptions$.push(sub);
    sub = this.requirements$.subscribe((requirements) => {
      this.requirements = requirements;
    });
    this.subscriptions$.push(sub);
  }

  ngOnDestroy(): void {
    this.subscriptions$.forEach((sub) => sub.unsubscribe());
  }

  async openPickProjectDialog(): Promise<void> {
    const dialogRef = this.dialog.open(PickReqbazProjectComponent, {
      minWidth: 300,
      width: '80%',
    });
    const {
      selectedProject,
      selectedCategory,
    }: {
      selectedProject: ReqbazProject;
      selectedCategory: { id: number };
    } = await firstValueFrom(dialogRef.afterClosed());
    if (selectedProject && selectedCategory) {
      const project = new ReqbazProject(
        selectedProject.name,
        selectedProject.id,
        selectedCategory.id,
      );

      this.ngrxStore.dispatch(
        addReqBazarProject({
          project,
        }),
      );
    }
  }

  async openDisconnectProjectDialog(): Promise<void> {
    const message = this.translate.instant(
      'success-modeling.requirements-list.disconnect-project-prompt',
    );

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      minWidth: 300,
      data: message,
    });
    const result = await dialogRef.afterClosed().toPromise();
    if (result) {
      this.successModel = SuccessModel.fromPlainObject(
        cloneDeep(this.successModel),
      );

      this.ngrxStore.dispatch(removeReqBazarProject());

      this.ngrxStore.dispatch(
        storeRequirements({ requirements: undefined }),
      );
    }
  }

  async refreshRequirements(): Promise<void> {
    if (!this.successModel || !this.successModel.reqBazProject) {
      return;
    }
    const requirements =
      await this.las2peer.fetchRequirementsOnReqBaz(
        this.successModel.reqBazProject.categoryId,
      );

    this.ngrxStore.dispatch(storeRequirements({ requirements }));
  }

  isRealized(requirement: Requirement): boolean {
    return Object.keys(requirement).includes('realized');
  }

  isLead(requirement: Requirement): boolean {
    return (
      Object.keys(requirement).includes('leadDeveloper') &&
      this.user &&
      requirement.leadDeveloper.userName ===
        this.user?.profile.preferred_username
    );
  }

  async realizeRequirement(requirement: Requirement): Promise<void> {
    await this.las2peer.realizeRequirementOnReqBaz(requirement.id);

    let newRequirement = this.requirements.find(
      (req) => req.id === requirement.id,
    );
    newRequirement = cloneDeep(newRequirement);
    newRequirement.realized = new Date();
    this.requirements = this.requirements.map((req) =>
      req.id === newRequirement.id ? newRequirement : req,
    );
    setTimeout(() => {
      void this.refreshRequirements();
    }, 1000);
  }

  async unrealizeRequirement(
    requirement: Requirement,
  ): Promise<void> {
    await this.las2peer.unrealizeRequirementOnReqBaz(requirement.id);
    let newRequirement = this.requirements.find(
      (req) => req.id === requirement.id,
    );
    newRequirement = cloneDeep(newRequirement);
    newRequirement.realized = undefined;
    this.requirements = this.requirements.map((req) =>
      req.id === newRequirement.id ? newRequirement : req,
    );
    setTimeout(() => {
      void this.refreshRequirements();
    }, 1000);
  }

  async becomeLeaddevRequirement(
    requirement: Requirement,
  ): Promise<void> {
    await this.las2peer.becomeLeaddeveloperOnReqBaz(requirement.id);
    void this.refreshRequirements();
  }

  async stopBeingLeaddevRequirement(
    requirement: Requirement,
  ): Promise<void> {
    await this.las2peer.stopBeingLeaddeveloperOnReqBaz(
      requirement.id,
    );
    void this.refreshRequirements();
  }

  getFrontendUrlForRequirement(requirement: Requirement): string {
    const reqBazProject: ReqbazProject =
      this.successModel.reqBazProject;
    if (!reqBazProject) {
      return null;
    }
    return joinAbsoluteUrlPath(
      environment.reqBazFrontendUrl,
      'projects',
      reqBazProject.id,
      'requirements',
      requirement.id,
    );
  }
}
