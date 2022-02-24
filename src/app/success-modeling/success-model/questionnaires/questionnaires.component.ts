import { Component, Input, OnInit } from '@angular/core';
import { DeleteQuestionnaireDialogComponent } from './delete-questionnaire-dialog/delete-questionnaire-dialog.component';
import { cloneDeep } from 'lodash-es';
import * as SqlString from 'sqlstring';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import {
  MEASURES,
  SELECTED_GROUP,
  SELECTED_SERVICE,
  USER_HAS_EDIT_RIGHTS,
  EDIT_MODE,
  QUESTIONNAIRES,
} from 'src/app/services/store.selectors';
import { GroupInformation } from 'src/app/models/community.model';
import { ServiceInformation } from 'src/app/models/service.model';
import { MeasureMap } from 'src/app/models/measure.catalog';
import {
  SuccessFactor,
  SuccessModel,
} from 'src/app/models/success.model';
import {
  Question,
  Questionnaire,
} from 'src/app/models/questionnaire.model';
import { Measure } from 'src/app/models/measure.model';
import { Query } from 'src/app/models/query.model';
import { ChartVisualization } from 'src/app/models/visualization.model';
import { Las2peerService } from 'src/app/services/las2peer.service';
import { Observable, Subscription } from 'rxjs';
import {
  fetchQuestionnaires,
  removeQuestionnaireFromModel,
  removeSurveyMeasuresFromModel,
} from 'src/app/services/store.actions';
import { environment } from 'src/environments/environment';
import { filter, take } from 'rxjs/operators';
import { QuestionnaireInfoDialogComponent } from 'src/app/shared/dialogs/questionnaire-info-dialog/questionnaire-info-dialog.component';
import { PickSurveyDialogComponent } from './pick-survey-dialog/pick-survey-dialog.component';

@Component({
  selector: 'app-questionnaires',
  templateUrl: './questionnaires.component.html',
  styleUrls: ['./questionnaires.component.scss'],
})
export class QuestionnairesComponent implements OnInit {
  @Input() model$: Observable<SuccessModel>;

  measures$ = this.ngrxStore.select(MEASURES);
  service$ = this.ngrxStore.select(SELECTED_SERVICE);
  editMode$ = this.ngrxStore.select(EDIT_MODE);
  questionnaires$ = this.ngrxStore.select(QUESTIONNAIRES);
  canEdit$ = this.ngrxStore.select(USER_HAS_EDIT_RIGHTS);
  group$ = this.ngrxStore.select(SELECTED_GROUP);

  mobsosSurveysUrl = environment.mobsosSurveysUrl;

  private availableQuestionnaires: Questionnaire[];
  private measures: MeasureMap;
  private model: SuccessModel;
  private service: ServiceInformation;
  private group: GroupInformation;

  private subscriptions$: Subscription[] = [];
  surveys: any;

  constructor(
    private dialog: MatDialog,
    private las2peer: Las2peerService,

    private ngrxStore: Store,
  ) {}

  static parseXml(xml: string): Document {
    const parser = new DOMParser();
    return parser.parseFromString(xml, 'text/xml');
  }

  private static extractQuestions(
    formXML: string,
    service: ServiceInformation,
  ): Question[] {
    const result: Question[] = [];
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
      let type: 'ordinal' | 'dichotomous';
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
        .replace('${SURVEY.RESOURCE}', service.alias);
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

  private static getSQL(
    surveyId: number,
    question: { code: string },
  ) {
    const dbName = environment.mobsosSurveysDatabaseName;

    return `SELECT qval AS Answer, COUNT(*) as number FROM ${dbName}.response WHERE  sid=${
      SqlString.escape(surveyId.toString()) as string
    } AND qkey = "${
      question.code
    }" GROUP BY Answer ORDER BY number DESC`;
  }

  private static addMeasuresFromQuestionnaireToModel(
    questionnaire: Questionnaire,
    surveyId: number,
    assignMeasures: boolean = false,
    service: ServiceInformation,
    measures: MeasureMap,
    model: SuccessModel,
  ): [SuccessModel, MeasureMap] {
    const questions = QuestionnairesComponent.extractQuestions(
      questionnaire.formXML,
      service,
    );
    for (const question of questions) {
      const measureName =
        questionnaire.name + ': ' + question.instructions;
      const query = QuestionnairesComponent.getSQL(
        surveyId,
        question,
      );
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
        ['surveyId=' + surveyId.toString(), 'generated'],
      );

      measures[measureName] = measure;
      if (
        assignMeasures &&
        question.dimensionRecommendation &&
        question.factorRecommendation
      ) {
        let dimension = model.dimensions[
          question.dimensionRecommendation
        ] as SuccessFactor[];
        dimension = QuestionnairesComponent.assignMeasuresToDimension(
          question,
          measureName,
          dimension,
        );
      }
    }
    return [model, measures];
  }
  private static assignMeasuresToDimension(
    question: Question,
    measureName: string,
    dimension: SuccessFactor[],
  ): SuccessFactor[] {
    let targetFactor: SuccessFactor = dimension.find(
      (factor) => factor.name === question.factorRecommendation,
    );
    if (!targetFactor) {
      targetFactor = new SuccessFactor(
        question.factorRecommendation,
        [],
      );

      dimension.push(targetFactor);
    }
    targetFactor.measures.push(measureName);

    return dimension;
  }

  getQuestionnaireByName(name: string): Questionnaire {
    return this.availableQuestionnaires?.find(
      (value) => value.name === name,
    );
  }

  async openPickQuestionnaireDialog(): Promise<void> {
    await this.dialog
      .open(PickSurveyDialogComponent, { data: this.surveys })
      .afterClosed()
      .toPromise();
  }

  async openRemoveQuestionnaireDialog(
    questionnaireIndex: number,
  ): Promise<void> {
    const dialogRef = this.dialog.open(
      DeleteQuestionnaireDialogComponent,
      {
        minWidth: 300,
      },
    );
    const result = (await dialogRef.afterClosed().toPromise()) as {
      deleteSurvey: boolean;
      deleteMeasures: boolean;
    };
    if (result) {
      const surveyId = this.model.surveys[questionnaireIndex].qid;
      if (result.deleteSurvey) {
        this.las2peer
          .deleteSurvey(surveyId)
          .catch((error) => console.error(error));
      }
      if (result.deleteMeasures) {
        const measureTag = `surveyId=${surveyId}`;
        this.ngrxStore.dispatch(
          removeSurveyMeasuresFromModel({ measureTag }),
        );
      }
      this.ngrxStore.dispatch(
        removeQuestionnaireFromModel({
          questionnaireId: surveyId,
        }),
      );
    }
  }

  async ngOnInit(): Promise<void> {
    let sub = this.group$.subscribe((group) => {
      this.group = group;
    });
    this.subscriptions$.push(sub);

    sub = this.questionnaires$.subscribe((qs) => {
      this.availableQuestionnaires = qs?.map((q) =>
        Questionnaire.fromPlainObject(q),
      );
    });
    this.subscriptions$.push(sub);

    sub = this.measures$.subscribe(
      (measures) =>
        (this.measures = cloneDeep(measures) as MeasureMap),
    );
    this.subscriptions$.push(sub);

    sub = this.model$.subscribe(
      (model) => (this.model = cloneDeep(model) as SuccessModel),
    );
    this.subscriptions$.push(sub);

    sub = this.service$.subscribe((service) => {
      this.service = service;
    });
    this.subscriptions$.push(sub);

    await this.editMode$
      .pipe(
        filter((edit) => !!edit),
        take(1),
      )
      .toPromise();
    // questionnaires will be fetched once after the edit mode is toggled
    this.ngrxStore.dispatch(fetchQuestionnaires());

    this.las2peer.getSurveys().subscribe((surveys) => {
      this.surveys = surveys;
    });
  }

  openInfoDialog(questionnaire: Questionnaire) {
    const q = this.getQuestionnaireByName(questionnaire.name);
    this.dialog.open(QuestionnaireInfoDialogComponent, {
      data: q,
    });
  }
}
