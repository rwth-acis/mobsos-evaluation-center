import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared/shared.module';

// eslint-disable-next-line max-len
// eslint-disable-next-line max-len

import { WorkspaceManagementComponent } from '../success-modeling/workspace-management/workspace-management.component';
import { VisitorComponent } from '../success-modeling/visitor/visitor.component';
import { RequirementsComponent } from '../success-modeling/requirements/requirements.component';
import { SuccessModelingComponent } from './success-modeling.component';
import { SuccessModelComponent } from './success-model/success-model.component';
import { SuccessDimensionComponent } from './success-model/success-dimension/success-dimension.component';
import { SuccessMeasureComponent } from './success-model/success-dimension/success-factor/success-measure/success-measure.component';
import { SuccessFactorComponent } from './success-model/success-dimension/success-factor/success-factor.component';

import { EditFactorDialogComponent } from './success-model/success-dimension/edit-factor-dialog/edit-factor-dialog.component';
import { EditMeasureDialogComponent } from './success-model/success-dimension/success-factor/edit-measure-dialog/edit-measure-dialog.component';
import { PickMeasureDialogComponent } from './success-model/success-dimension/success-factor/pick-measure-dialog/pick-measure-dialog.component';
import { SurveyComponent } from './success-model/surveys/surveys.component';
import { PickQuestionnaireDialogComponent } from './success-model/surveys/pick-questionnaire-dialog/pick-questionnaire-dialog.component';
import { RemoveSurveyDialogComponent } from './success-model/surveys/remove-survey-dialog/remove-survey-dialog.component';
import { PickReqbazProjectComponent } from './requirements/pick-reqbaz-project/pick-reqbaz-project.component';
import { SuccessModelingRoutingModule } from './success-modeling-routing.module';
import { CommunityInfoComponent } from './community-info/community-info.component';
import { PickSurveyDialogComponent } from './success-model/surveys/pick-survey-dialog/pick-survey-dialog.component';
import { VisualizationsModule } from 'src/app/shared/visualizations/visualizations.module';

@NgModule({
  declarations: [
    SuccessDimensionComponent,
    SuccessMeasureComponent,
    SuccessFactorComponent,
    SuccessModelingComponent,
    EditFactorDialogComponent,
    EditMeasureDialogComponent,
    PickMeasureDialogComponent,
    SurveyComponent,
    PickQuestionnaireDialogComponent,
    RemoveSurveyDialogComponent,
    PickReqbazProjectComponent,
    WorkspaceManagementComponent,
    VisitorComponent,
    RequirementsComponent,
    SuccessModelComponent,
    CommunityInfoComponent,
    PickSurveyDialogComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    SuccessModelingRoutingModule,
    VisualizationsModule,
  ],
})
export class SuccessModelingModule {}
