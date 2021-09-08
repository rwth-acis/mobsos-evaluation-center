import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { SuccessDimensionComponent } from '../success-modeling/success-dimension/success-dimension.component';
import { SuccessMeasureComponent } from '../success-modeling/success-measure/success-measure.component';
import { SuccessFactorComponent } from '../success-modeling/success-factor/success-factor.component';
import { ErrorDialogComponent } from './visualizations/error-dialog/error-dialog.component';
import { BaseVisualizationComponent } from '../success-modeling/visualizations/visualization.component';
import { ValueVisualizationComponent } from '../success-modeling/visualizations/value-visualization/value-visualization.component';
import { ChartVisualizerComponent } from '../success-modeling/visualizations/chart-visualization/chart-visualization.component';
import { KpiVisualizationComponent } from '../success-modeling/visualizations/kpi-visualization/kpi-visualization.component';

import { EditFactorDialogComponent } from '../success-modeling/success-dimension/edit-factor-dialog/edit-factor-dialog.component';
import { EditMeasureDialogComponent } from '../success-modeling/success-factor/edit-measure-dialog/edit-measure-dialog.component';
import { PickMeasureDialogComponent } from '../success-modeling/success-factor/pick-measure-dialog/pick-measure-dialog.component';
import { QuestionnairesComponent } from '../success-modeling/questionnaires/questionnaires.component';
// eslint-disable-next-line max-len
import { PickQuestionnaireDialogComponent } from '../success-modeling/questionnaires/pick-questionnaire-dialog/pick-questionnaire-dialog.component';
// eslint-disable-next-line max-len
import { DeleteQuestionnaireDialogComponent } from '../success-modeling/questionnaires/delete-questionnaire-dialog/delete-questionnaire-dialog.component';
import { SqlTableComponent } from '../success-modeling/success-factor/edit-measure-dialog/sql-table/sql-table.component';
import { RequirementsListComponent } from '../success-modeling/requirements-list/requirements-list.component';
import { PickReqbazProjectComponent } from '../success-modeling/requirements-list/pick-reqbaz-project/pick-reqbaz-project.component';
import { WorkspaceManagementComponent } from '../success-modeling/workspace-management/workspace-management.component';
import { JoinWorkSpaceComponent } from '../join-work-space/join-work-space.component';
import { VisitorComponent } from '../success-modeling/visitor/visitor.component';
import { VisualizationInfoComponent } from '../success-modeling/visualizations/visualization-info/visualization-info.component';
import { RequirementsComponent } from '../success-modeling/requirements/requirements.component';
import { WorkspaceComponent } from '../success-modeling/workspace/workspace.component';
import { RawDataDialogComponent } from '../raw-data-dialog/raw-data-dialog.component';
import { PickUsernameDialogComponent } from './pick-username-dialog/pick-username-dialog.component';
import { SuccessModelingComponent } from './success-modeling.component';
import { GoogleChartsModule } from 'angular-google-charts';

@NgModule({
  declarations: [
    SuccessDimensionComponent,
    SuccessMeasureComponent,
    SuccessFactorComponent,
    SuccessModelingComponent,
    ErrorDialogComponent,
    BaseVisualizationComponent,
    ValueVisualizationComponent,
    ChartVisualizerComponent,
    KpiVisualizationComponent,
    EditFactorDialogComponent,
    EditMeasureDialogComponent,
    PickMeasureDialogComponent,
    PickUsernameDialogComponent,
    EditMeasureDialogComponent,
    QuestionnairesComponent,
    PickQuestionnaireDialogComponent,
    DeleteQuestionnaireDialogComponent,
    SqlTableComponent,
    RequirementsListComponent,
    PickReqbazProjectComponent,
    WorkspaceManagementComponent,
    JoinWorkSpaceComponent,
    VisitorComponent,
    VisualizationInfoComponent,
    RequirementsComponent,
    WorkspaceComponent,
    RawDataDialogComponent,
  ],
  imports: [CommonModule, SharedModule, GoogleChartsModule],
})
export class SuccessModelingModule {}
