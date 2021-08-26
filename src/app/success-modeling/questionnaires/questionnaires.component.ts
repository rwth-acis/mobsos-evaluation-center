import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';

import { PickQuestionnaireDialogComponent } from './pick-questionnaire-dialog/pick-questionnaire-dialog.component';
import { environment } from '../../../environments/environment';
import { DeleteQuestionnaireDialogComponent } from './delete-questionnaire-dialog/delete-questionnaire-dialog.component';
import { NGXLogger } from 'ngx-logger';
import * as SqlString from 'sqlstring';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import {
  MEASURES,
  QUESTIONNAIRES,
  SELECTED_GROUP,
  SELECTED_SERVICE,
  SUCCESS_MODEL,
  USER_HAS_EDIT_RIGHTS,
  EDIT_MODE,
} from 'src/app/services/store.selectors';
import { GroupInformation } from 'src/app/models/community.model';
import { ServiceInformation } from 'src/app/models/service.model';
import { MeasureMap } from 'src/app/models/measure.catalog';
import {
  SuccessFactor,
  SuccessModel,
} from 'src/app/models/success.model';
import {
  IQuestionnaire,
  Questionnaire,
  Questionnaire as QuestionnaireModel,
} from 'src/app/models/questionnaire.model';
import { Measure } from 'src/app/models/measure.model';
import { Query } from 'src/app/models/query.model';
import { ChartVisualization } from 'src/app/models/visualization.model';
import { Las2peerService } from 'src/app/services/las2peer.service';
import { Subscription } from 'rxjs';
import { fetchQuestionnaires } from 'src/app/services/store.actions';

@Component({
  selector: 'app-questionnaires',
  templateUrl: './questionnaires.component.html',
  styleUrls: ['./questionnaires.component.scss'],
})
export class QuestionnairesComponent implements OnInit {
  availableQuestionnaires: Questionnaire[];
  measures: MeasureMap;
  model: SuccessModel;
  service: ServiceInformation;
  editMode = false;
  groupID: string;

  mobsosSurveysUrl = environment.mobsosSurveysUrl;
  group$ = this.ngrxStore.select(SELECTED_GROUP);
  model$ = this.ngrxStore.select(SUCCESS_MODEL);
  measures$ = this.ngrxStore.select(MEASURES);
  service$ = this.ngrxStore.select(SELECTED_SERVICE);
  editMode$ = this.ngrxStore.select(EDIT_MODE);
  questionnaires$ = this.ngrxStore.select(QUESTIONNAIRES);
  group: GroupInformation;
  canEdit$ = this.ngrxStore.select(USER_HAS_EDIT_RIGHTS);

  subscriptions$: Subscription[] = [];
  constructor(
    private dialog: MatDialog,
    private las2peer: Las2peerService,
    private logger: NGXLogger,
    private ngrxStore: Store,
  ) {}

  static parseXml(xml) {
    const parser = new DOMParser();
    return parser.parseFromString(xml, 'text/xml');
  }

  private static nowAsIsoDate(): string {
    return new Date().toISOString();
  }

  private static in100YearsAsIsoDate(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const day = now.getDate();
    return new Date(year + 100, month, day).toISOString();
  }

  ngOnInit() {
    this.ngrxStore.dispatch(fetchQuestionnaires());
    let sub = this.group$.subscribe((group) => {
      this.group = group;
      this.groupID = group.id;
    });
    this.subscriptions$.push(sub);

    sub = this.questionnaires$.subscribe((qs) => {
      this.availableQuestionnaires = qs;
    });
    this.subscriptions$.push(sub);

    sub = this.measures$.subscribe(
      (measures) => (this.measures = measures),
    );
    this.subscriptions$.push(sub);

    sub = this.model$.subscribe((model) => (this.model = model));
    this.subscriptions$.push(sub);

    sub = this.service$.subscribe((service) => {
      this.service = service;
    });
    this.subscriptions$.push(sub);

    sub = this.editMode$.subscribe(
      (editMode) => (this.editMode = editMode),
    );
    this.subscriptions$.push(sub);
  }

  async openPickQuestionnaireDialog() {
    // remove questionnaires that already have been chosen
    const questionnaires = this.availableQuestionnaires.filter(
      (questionnaire) =>
        !!this.model.questionnaires.find(
          (q) => q.id === questionnaire.id,
        ),
    );
    const dialogRef = this.dialog.open(
      PickQuestionnaireDialogComponent,
      {
        minWidth: 300,
        width: '80%',
        data: questionnaires,
      },
    );
    const result = await dialogRef.afterClosed().toPromise();

    if (result) {
      this.createNewSurvey(
        result.selectedQuestionnaire as IQuestionnaire,
        result.addMeasures,
        result.assignMeasures,
      );
    }
  }

  async openRemoveQuestionnaireDialog(questionnaireIndex: number) {
    const dialogRef = this.dialog.open(
      DeleteQuestionnaireDialogComponent,
      {
        minWidth: 300,
      },
    );
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        const surveyId =
          this.model.questionnaires[questionnaireIndex].surveyId;
        if (result.deleteSurvey) {
          this.las2peer
            .deleteSurvey(surveyId)
            .catch((error) => this.logger.error(error));
        }
        if (result.deleteMeasures) {
          const measureTag = 'surveyId=' + surveyId;
          const measureNamesToBeRemoved = Object.keys(
            this.measures,
          ).filter((measureName) =>
            this.measures[measureName].tags.includes(measureTag),
          );
          for (const dimension of Object.values(
            this.model.dimensions,
          )) {
            // collect empty factors here
            const factorsToBeRemoved = [];
            for (const factor of dimension as SuccessFactor[]) {
              for (const measureName of measureNamesToBeRemoved) {
                if (factor.measures.includes(measureName)) {
                  const index = factor.measures.indexOf(measureName);
                  factor.measures.splice(index, 1);
                  if (factor.measures.length === 0) {
                    factorsToBeRemoved.push(factor);
                  }
                }
              }
            }
            for (const factor of factorsToBeRemoved) {
              const index = (dimension as SuccessFactor[]).indexOf(
                factor,
              );
              (dimension as SuccessFactor[]).splice(index, 1);
            }
          }
        }
        this.model.questionnaires.splice(questionnaireIndex, 1);
      }
    });
  }

  private getQuestionnaireByName(name: string): Questionnaire {
    if (!this.availableQuestionnaires) {
      return null;
    }
    return this.availableQuestionnaires?.find(
      (value) => value.name === name,
    );
  }

  private extractQuestions(formXML: string): {
    code: string;
    type: 'ordinal' | 'dichotomous';
    dimensionRecommendation: string;
    factorRecommendation: string;
    instructions: string;
  }[] {
    const result = [];
    const xml = QuestionnairesComponent.parseXml(formXML);
    let pages = Array.from(xml.getElementsByTagName('qu:Page'));
    pages = pages.filter((page) => {
      const type = page.getAttribute('xsi:type');
      return (
        type === 'qu:OrdinalScaleQuestionPageType' ||
        type === 'qu:DichotomousQuestionPageType'
      );
    });
    for (const page of pages) {
      const code = page.getAttribute('qid');
      let type: string;
      if (
        page.getAttribute('xsi:type') ===
        'qu:OrdinalScaleQuestionPageType'
      ) {
        type = 'ordinal';
      } else {
        type = 'dichotomous';
      }
      let dimensionRecommendation: string = null;
      let factorRecommendation: string = null;
      const recommendations = Array.from(
        page.getElementsByTagName('qu:SuccessModelRecommendation'),
      );
      if (recommendations.length > 0) {
        const recommendation = recommendations[0];
        dimensionRecommendation =
          recommendation.getAttribute('dimension');
        factorRecommendation = recommendation.getAttribute('factor');
      }
      const instructionsElement = Array.from(
        page.getElementsByTagName('qu:Instructions'),
      )[0];
      const instructions = instructionsElement.innerHTML
        .trim()
        .replace('${SURVEY.RESOURCE}', this.service.alias);
      result.push({
        code,
        type,
        dimensionRecommendation,
        factorRecommendation,
        instructions,
      });
    }
    return result;
  }

  createNewSurvey(
    questionnaire: IQuestionnaire,
    addMeasures: boolean,
    assignMeasures: boolean,
  ) {
    let serviceName = this.service.name;
    if (serviceName.includes('@')) {
      serviceName = serviceName.split('@')[0];
    }
    const surveyName =
      this.service.alias +
      ': ' +
      questionnaire.name +
      '(' +
      QuestionnairesComponent.nowAsIsoDate() +
      ')';
    this.las2peer
      .createSurvey(
        surveyName,
        questionnaire.description,
        this.group.name,
        questionnaire.logo,
        QuestionnairesComponent.nowAsIsoDate(),
        QuestionnairesComponent.in100YearsAsIsoDate(),
        serviceName,
        this.service.alias,
        questionnaire.lang,
      )
      .then((response) => {
        const surveyId = parseInt(
          (response as { id: string }).id,
          10,
        );
        this.las2peer
          .setQuestionnaireForSurvey(questionnaire.id, surveyId)
          .then(() => {
            this.model.questionnaires.push(
              new QuestionnaireModel(
                questionnaire.name,
                questionnaire.id,
                surveyId,
              ),
            );

            if (addMeasures) {
              const questions = this.extractQuestions(
                questionnaire.formXML,
              );
              for (const question of questions) {
                const measureName =
                  questionnaire.name + ': ' + question.instructions;
                const query =
                  'SELECT JSON_EXTRACT(REMARKS,"$.qval") AS Answer, COUNT(*) FROM MESSAGE m ' +
                  'WHERE m.EVENT = "SERVICE_CUSTOM_MESSAGE_1" AND JSON_EXTRACT(REMARKS,"$.sid") = ' +
                  SqlString.escape(surveyId) +
                  ' AND JSON_EXTRACT(REMARKS,"$.qkey") = "' +
                  question.code +
                  '" GROUP BY JSON_EXTRACT(REMARKS,"$.qval")';
                const measure = new Measure(
                  measureName,
                  [new Query('Answer Distribution', query)],
                  new ChartVisualization(
                    'BarChart',
                    measureName,
                    measureName,
                    '300px',
                    '300px',
                  ),
                  ['surveyId=' + surveyId, 'generated'],
                );
                this.measures[measureName] = measure;
                if (
                  assignMeasures &&
                  question.dimensionRecommendation &&
                  question.factorRecommendation
                ) {
                  const dimension =
                    this.model.dimensions[
                      question.dimensionRecommendation
                    ];
                  let targetFactor: SuccessFactor;
                  for (const factor of dimension as SuccessFactor[]) {
                    if (
                      factor.name === question.factorRecommendation
                    ) {
                      targetFactor = factor;
                      break;
                    }
                  }
                  if (!targetFactor) {
                    targetFactor = new SuccessFactor(
                      question.factorRecommendation,
                      [],
                    );
                  }
                  targetFactor.measures.push(measureName);
                  dimension.push(targetFactor);
                }
              }
            }
          });
      });
  }
}
