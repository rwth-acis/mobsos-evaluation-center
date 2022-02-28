import { Component, Inject, OnInit } from '@angular/core';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { userInfo } from 'os';
import { firstValueFrom, take } from 'rxjs';
import { Questionnaire } from 'src/app/models/questionnaire.model';
import { Survey } from 'src/app/models/survey.model';
import {
  joinAbsoluteUrlPath,
  Las2peerService,
} from 'src/app/services/las2peer.service';
import { addSurveyToModel } from 'src/app/services/store.actions';
import {
  QUESTIONNAIRES_NOT_IN_MODEL,
  SELECTED_GROUP,
  SELECTED_SERVICE,
  SURVEYS,
  USER,
  _SELECTED_SERVICE_NAME,
} from 'src/app/services/store.selectors';
import { environment } from 'src/environments/environment';
import { PickQuestionnaireDialogComponent } from '../pick-questionnaire-dialog/pick-questionnaire-dialog.component';

@Component({
  selector: 'app-pick-survey-dialog',
  templateUrl: './pick-survey-dialog.component.html',
  styleUrls: ['./pick-survey-dialog.component.scss'],
})
export class PickSurveyDialogComponent implements OnInit {
  selectedSurvey: Survey;
  addMeasures = true;
  assignMeasures = true;
  mobsosSurveysUrl = environment.mobsosSurveysUrl;
  surveys$ = this.ngrxStore.select(SURVEYS);

  constructor(
    private dialogRef: MatDialogRef<PickSurveyDialogComponent>,
    private ngrxStore: Store,
    private dialog: MatDialog,
    private l2p: Las2peerService,
  ) {}

  ngOnInit(): void {}

  onAddMeasuresChange(addMeasures: boolean): void {
    if (!addMeasures) {
      this.assignMeasures = false;
    }
    this.addMeasures = addMeasures;
  }
  closeDialog() {
    this.dialogRef.close({
      selectedSurvey: this.selectedSurvey,
      addMeasures: this.addMeasures,
      assignMeasures: this.assignMeasures,
    });
  }
  async openAddSurveyDialog() {
    const availableQuestionnaires: Questionnaire[] =
      await firstValueFrom(
        this.ngrxStore
          .select(QUESTIONNAIRES_NOT_IN_MODEL)
          .pipe(take(1)),
      );
    const dialogRef = this.dialog.open(
      PickQuestionnaireDialogComponent,
      {
        minWidth: 300,
        width: '80%',
        data: availableQuestionnaires,
      },
    );
    const { selectedQuestionnaire, addMeasures, assignMeasures } =
      await firstValueFrom(dialogRef.afterClosed());
    if (selectedQuestionnaire) {
      const survey = await this.createNewSurvey(
        selectedQuestionnaire as Questionnaire,
      );

      this.dialogRef.close({
        selectedSurvey: survey,
        addMeasures,
        assignMeasures,
      });
    }
  }

  private async createNewSurvey(
    questionnaire: Questionnaire,
  ): Promise<Survey> {
    const service = await firstValueFrom(
      this.ngrxStore.select(SELECTED_SERVICE).pipe(take(1)),
    );
    const group = await firstValueFrom(
      this.ngrxStore.select(SELECTED_GROUP).pipe(take(1)),
    );
    const user = await firstValueFrom(
      this.ngrxStore.select(USER).pipe(take(1)),
    );
    let serviceName = service.name;
    if (serviceName.includes('@')) {
      serviceName = serviceName.split('@')[0];
    }
    const surveyName = `${service.alias}: ${
      questionnaire.name
    } (${nowAsIsoDate()}) `;

    try {
      const response = await this.l2p.createSurvey(
        surveyName,
        questionnaire.description,
        group.name,
        questionnaire.logo,
        nowAsIsoDate(),
        in100YearsAsIsoDate(),
        serviceName,
        service.alias,
        questionnaire.lang,
      );
      if (!response || !('id' in response)) {
        throw new Error('Invalid survey id: undefined');
      }

      const surveyId = parseInt((response as { id: string }).id, 10);

      await this.l2p.setQuestionnaireForSurvey(
        questionnaire.id,
        surveyId,
      );

      return new Survey({
        name: surveyName,
        id: surveyId,
        description: questionnaire.description,
        qid: questionnaire.id,
        logo: questionnaire.logo,
        lang: questionnaire.lang,
        start: nowAsIsoDate(),
        end: in100YearsAsIsoDate(),
        organization: group.name,
        resource: serviceName,
        owner: user.profile.preferred_username,
        url: joinAbsoluteUrlPath(
          this.mobsosSurveysUrl,
          'surveys',
          surveyId,
        ),
        'resource-label': service.alias,
      });
    } catch (error) {
      console.error(error);
    }
  }
}

function nowAsIsoDate(): string {
  return new Date().toISOString();
}

function in100YearsAsIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();
  return new Date(year + 100, month, day).toISOString();
}
