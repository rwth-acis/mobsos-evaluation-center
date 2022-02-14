import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';

// eslint-disable-next-line max-len
// eslint-disable-next-line max-len

import { WorkspaceManagementComponent } from '../success-modeling/workspace-management/workspace-management.component';
import { VisitorComponent } from '../success-modeling/visitor/visitor.component';
import { RequirementsComponent } from '../success-modeling/requirements/requirements.component';
import { SuccessModelingComponent } from './success-modeling.component';
import { GoogleChartsModule } from 'angular-google-charts';
import { SuccessModelComponent } from './success-model/success-model.component';
import { SuccessDimensionComponent } from './success-model/success-dimension/success-dimension.component';
import { SuccessMeasureComponent } from './success-model/success-dimension/success-factor/success-measure/success-measure.component';
import { SuccessFactorComponent } from './success-model/success-dimension/success-factor/success-factor.component';
import { ErrorDialogComponent } from './success-model/success-dimension/success-factor/success-measure/visualizations/error-dialog/error-dialog.component';
import { VisualizationComponent } from './success-model/success-dimension/success-factor/success-measure/visualizations/visualization.component';
import { ValueVisualizationComponent } from './success-model/success-dimension/success-factor/success-measure/visualizations/value-visualization/value-visualization.component';
import { ChartVisualizerComponent } from './success-model/success-dimension/success-factor/success-measure/visualizations/chart-visualization/chart-visualization.component';
import { KpiVisualizationComponent } from './success-model/success-dimension/success-factor/success-measure/visualizations/kpi-visualization/kpi-visualization.component';
import { EditFactorDialogComponent } from './success-model/success-dimension/edit-factor-dialog/edit-factor-dialog.component';
import { EditMeasureDialogComponent } from './success-model/success-dimension/success-factor/edit-measure-dialog/edit-measure-dialog.component';
import { PickMeasureDialogComponent } from './success-model/success-dimension/success-factor/pick-measure-dialog/pick-measure-dialog.component';
import { QuestionnairesComponent } from './success-model/questionnaires/questionnaires.component';
import { PickQuestionnaireDialogComponent } from './success-model/questionnaires/pick-questionnaire-dialog/pick-questionnaire-dialog.component';
import { DeleteQuestionnaireDialogComponent } from './success-model/questionnaires/delete-questionnaire-dialog/delete-questionnaire-dialog.component';
import { VisualizationInfoComponent } from './success-model/success-dimension/success-factor/success-measure/visualizations/visualization-info/visualization-info.component';
import { RawDataDialogComponent } from './success-model/success-dimension/success-factor/success-measure/visualizations/raw-data-dialog/raw-data-dialog.component';
import { PickReqbazProjectComponent } from './requirements/pick-reqbaz-project/pick-reqbaz-project.component';
import { SuccessModelingRoutingModule } from './success-modeling-routing.module';
import { CommunityInfoComponent } from './community-info/community-info.component';

@NgModule({
  declarations: [
    SuccessDimensionComponent,
    SuccessMeasureComponent,
    SuccessFactorComponent,
    SuccessModelingComponent,
    ErrorDialogComponent,
    VisualizationComponent,
    ValueVisualizationComponent,
    ChartVisualizerComponent,
    KpiVisualizationComponent,
    EditFactorDialogComponent,
    EditMeasureDialogComponent,
    PickMeasureDialogComponent,
    EditMeasureDialogComponent,
    QuestionnairesComponent,
    PickQuestionnaireDialogComponent,
    DeleteQuestionnaireDialogComponent,
    PickReqbazProjectComponent,
    WorkspaceManagementComponent,
    VisitorComponent,
    VisualizationInfoComponent,
    RequirementsComponent,
    RawDataDialogComponent,
    SuccessModelComponent,
    CommunityInfoComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    GoogleChartsModule,
    SuccessModelingRoutingModule,
  ],
})
export class SuccessModelingModule {}
