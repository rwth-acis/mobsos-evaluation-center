import {Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges} from '@angular/core';
import {SuccessModel} from '../../../success-model/success-model';
import {MatDialog} from '@angular/material';
import {PickReqbazProjectComponent} from './pick-reqbaz-project/pick-reqbaz-project.component';
import {ReqbazProject} from '../../../success-model/reqbaz-project';
import {ConfirmationDialogComponent} from '../../confirmation-dialog/confirmation-dialog.component';
import {TranslateService} from '@ngx-translate/core';
import {environment} from '../../../environments/environment';
import {Las2peerService} from '../../las2peer.service';
import {isNumber} from "util";

@Component({
  selector: 'app-requirements-list',
  templateUrl: './requirements-list.component.html',
  styleUrls: ['./requirements-list.component.scss']
})
export class RequirementsListComponent implements OnInit, OnChanges, OnDestroy {

  @Input() successModel: SuccessModel;
  @Output() successModelChange = new EventEmitter<SuccessModel>();
  @Output() numberOfRequirements = new EventEmitter<number>();

  requirements;
  refreshRequirementsHandle;
  frontendUrl = environment.reqBazFrontendUrl;

  constructor(private dialog: MatDialog, private translate: TranslateService, private las2peer: Las2peerService) {
  }

  static joinAbsoluteUrlPath(...args) {
    return args.map(pathPart => {
      if (isNumber(pathPart)) {
        pathPart = pathPart.toString();
      }
      return pathPart.replace(/(^\/|\/$)/g, '');
    }).join('/');
  }

  ngOnInit() {
    this.refreshRequirements();
    this.refreshRequirementsHandle = setInterval(
      () => this.refreshRequirements(),
      environment.servicePollingInterval * 1000
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (Object.keys(changes).includes('successModel')) {
      this.refreshRequirements();
    }
  }

  ngOnDestroy(): void {
  }

  openPickProjectDialog() {
    const dialogRef = this.dialog.open(PickReqbazProjectComponent, {
      minWidth: 300,
      width: '80%',
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.successModel.reqBazProject = new ReqbazProject(result.selectedProject.name, result.selectedProject.id,
          result.selectedCategory.id);
        this.successModelChange.emit(this.successModel);
        this.refreshRequirements();
      }
    });
  }

  async openDisconnectProjectDialog() {
    const message = await this.translate.get('success-modeling.requirements-list.disconnect-project-prompt').toPromise();
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      minWidth: 300,
      data: message,
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.successModel.reqBazProject = null;
        this.successModelChange.emit(this.successModel);
        this.numberOfRequirements.emit(0);
      }
    });
  }

  refreshRequirements() {
    if (!this.successModel || !this.successModel.reqBazProject) {
      this.requirements = [];
      return;
    }
    this.las2peer.fetchRequirementsOnReqBaz(this.successModel.reqBazProject.categoryId)
      .then(requirements => {
        this.requirements = requirements;
        this.numberOfRequirements.emit((requirements as []).length);
      });
  }

  isRealized(requirement) {
    return Object.keys(requirement).includes('realized');
  }

  realizeRequirement(requirement: any) {
    this.las2peer.realizeRequirementOnReqBaz(requirement.id);
    this.refreshRequirements();
  }

  unrealizeRequirement(requirement: any) {
    this.las2peer.unrealizeRequirementOnReqBaz(requirement.id);
    this.refreshRequirements();
  }

  getFrontendUrlForRequirement(requirement: any) {
    const reqBazProject: ReqbazProject = this.successModel.reqBazProject;
    if (!reqBazProject) {
      return '';
    }
    return RequirementsListComponent.joinAbsoluteUrlPath(environment.reqBazFrontendUrl, 'projects',
      reqBazProject.id, 'categories', reqBazProject.categoryId, 'requirements', requirement.id);
  }
}
