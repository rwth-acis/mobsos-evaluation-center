import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';

import { PickReqbazProjectComponent } from './pick-reqbaz-project/pick-reqbaz-project.component';
import { ConfirmationDialogComponent } from '../../confirmation-dialog/confirmation-dialog.component';
import { TranslateService } from '@ngx-translate/core';
import { environment } from '../../../environments/environment';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { _USER } from 'src/app/services/store.selectors';
import {
  addReqBazarProject,
  removeReqBazarProject,
  setNumberOfRequirements,
  storeSuccessModel,
} from 'src/app/services/store.actions';
import { User } from 'src/app/models/user.model';
import { SuccessModel } from 'src/app/models/success.model';
import { ReqbazProject } from 'src/app/models/reqbaz.model';
import { Las2peerService } from 'src/app/services/las2peer.service';
import { cloneDeep } from 'lodash-es';
@Component({
  selector: 'app-requirements-list',
  templateUrl: './requirements-list.component.html',
  styleUrls: ['./requirements-list.component.scss'],
})
export class RequirementsListComponent
  implements OnInit, OnChanges, OnDestroy
{
  @Input() successModel: SuccessModel;

  @Output() numberOfRequirements = new EventEmitter<number>();

  user$ = this.ngrxStore.select(_USER);
  requirements;
  refreshRequirementsHandle;
  frontendUrl = environment.reqBazFrontendUrl;
  openedRequirement = null;
  private user: User;

  constructor(
    private dialog: MatDialog,
    private translate: TranslateService,
    private las2peer: Las2peerService,
    private ngrxStore: Store,
  ) {}

  static joinAbsoluteUrlPath(...args) {
    return args
      .map((pathPart) => {
        if (typeof pathPart === 'number') {
          pathPart = pathPart.toString();
        }
        return pathPart.replace(/(^\/|\/$)/g, '');
      })
      .join('/');
  }

  ngOnInit() {
    this.user$.subscribe((user) => (this.user = user));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (Object.keys(changes).includes('successModel')) {
      this.refreshRequirements();
    }
  }

  ngOnDestroy(): void {}

  openPickProjectDialog() {
    const dialogRef = this.dialog.open(PickReqbazProjectComponent, {
      minWidth: 300,
      width: '80%',
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.successModel = SuccessModel.fromPlainObject(
          cloneDeep(this.successModel),
        );
        this.successModel.reqBazProject = new ReqbazProject(
          result.selectedProject.name,
          result.selectedProject.id,
          result.selectedCategory.id,
        );
        this.ngrxStore.dispatch(
          addReqBazarProject({
            project: this.successModel.reqBazProject,
          }),
        );

        this.ngrxStore.dispatch(
          storeSuccessModel({
            xml: this.successModel.toXml().outerHTML,
          }),
        );

        this.refreshRequirements();
      }
    });
  }

  async openDisconnectProjectDialog() {
    const message = await this.translate
      .get(
        'success-modeling.requirements-list.disconnect-project-prompt',
      )
      .toPromise();
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      minWidth: 300,
      data: message,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.successModel = SuccessModel.fromPlainObject(
          cloneDeep(this.successModel),
        );
        const id = this.successModel.reqBazProject.id;
        this.ngrxStore.dispatch(
          removeReqBazarProject({
            id,
          }),
        );

        this.successModel.reqBazProject = null;
        this.ngrxStore.dispatch(
          storeSuccessModel({
            xml: this.successModel.toXml().outerHTML,
          }),
        );
        this.setNumberOfRequirements(0);
        this.numberOfRequirements.emit(0);
      }
    });
  }

  setNumberOfRequirements(n: number) {
    this.ngrxStore.dispatch(setNumberOfRequirements({ n }));
  }

  refreshRequirements() {
    if (!this.successModel || !this.successModel.reqBazProject) {
      this.requirements = [];
      return;
    }
    this.las2peer
      .fetchRequirementsOnReqBaz(
        this.successModel.reqBazProject.categoryId,
      )
      .then((requirements) => {
        this.requirements = requirements;
        this.setNumberOfRequirements((requirements as [])?.length);
        this.numberOfRequirements.emit((requirements as []).length);
      });
  }

  isRealized(requirement) {
    return Object.keys(requirement).includes('realized');
  }

  isLead(requirement) {
    return (
      Object.keys(requirement).includes('leadDeveloper') &&
      this.user &&
      requirement.leadDeveloper.userName ===
        this.user?.profile.preferred_username
    );
  }

  realizeRequirement(requirement: any) {
    this.las2peer.realizeRequirementOnReqBaz(requirement.id);
    this.refreshRequirements();
  }

  unrealizeRequirement(requirement: any) {
    this.las2peer.unrealizeRequirementOnReqBaz(requirement.id);
    this.refreshRequirements();
  }

  becomeLeaddevRequirement(requirement: any) {
    this.las2peer.becomeLeaddeveloperOnReqBaz(requirement.id);
    this.refreshRequirements();
  }

  stopBeingLeaddevRequirement(requirement: any) {
    this.las2peer.stopBeingLeaddeveloperOnReqBaz(requirement.id);
    this.refreshRequirements();
  }

  getFrontendUrlForRequirement(requirement: any) {
    const reqBazProject: ReqbazProject =
      this.successModel.reqBazProject;
    if (!reqBazProject) {
      return '';
    }
    return RequirementsListComponent.joinAbsoluteUrlPath(
      environment.reqBazFrontendUrl,
      'projects',
      reqBazProject.id,
      'categories',
      reqBazProject.categoryId,
      'requirements',
      requirement.id,
    );
  }
}
