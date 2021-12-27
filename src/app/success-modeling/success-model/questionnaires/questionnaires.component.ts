import { Component, Input, OnInit } from '@angular/core';

import { PickQuestionnaireDialogComponent } from './pick-questionnaire-dialog/pick-questionnaire-dialog.component';

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
import {
  MeasureCatalog,
  MeasureMap,
} from 'src/app/models/measure.catalog';
import {
  SuccessFactor,
  SuccessModel,
} from 'src/app/models/success.model';
import {
  IQuestionnaire,
  Question,
  Questionnaire,
  Questionnaire as QuestionnaireModel,
} from 'src/app/models/questionnaire.model';
import { Measure } from 'src/app/models/measure.model';
import { Query } from 'src/app/models/query.model';
import { ChartVisualization } from 'src/app/models/visualization.model';
import { Las2peerService } from 'src/app/services/las2peer.service';
import { Observable, Subscription } from 'rxjs';
import {
  addCatalogToWorkspace,
  addModelToWorkSpace,
  addQuestionnaireToModel,
  fetchQuestionnaires,
} from 'src/app/services/store.actions';
import { environment } from 'src/environments/environment';
import { filter, take } from 'rxjs/operators';

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
    // eslint-disable-next-line max-len
    return `SELECT JSON_EXTRACT(REMARKS,"$.qval") AS Answer, COUNT(*) FROM MESSAGE m WHERE m.EVENT = "SERVICE_CUSTOM_MESSAGE_1" AND JSON_EXTRACT(REMARKS,"$.sid") = ${
      SqlString.escape(surveyId.toString()) as string
    } AND JSON_EXTRACT(REMARKS,"$.qkey") = "${
      question.code
    }" GROUP BY JSON_EXTRACT(REMARKS,"$.qval")`;
  }

  private static addMeasuresFromQuestionnaireToModel(
    questionnaire: IQuestionnaire,
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
    let targetFactor: SuccessFactor;
    for (const factor of dimension) {
      if (factor.name === question.factorRecommendation) {
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
    return dimension;
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

  getQuestionnaireByName(name: string): Questionnaire {
    return this.availableQuestionnaires?.find(
      (value) => value.name === name,
    );
  }

  async openPickQuestionnaireDialog(): Promise<void> {
    // remove questionnaires that already have been chosen
    const questionnaires = this.availableQuestionnaires.filter(
      (questionnaire) =>
        !this.model.questionnaires.find(
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
      void this.createNewSurvey(
        result.selectedQuestionnaire as IQuestionnaire,
        result.addMeasures,
        result.assignMeasures,
      );
    }
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
      const surveyId =
        this.model.questionnaires[questionnaireIndex].surveyId;
      if (result.deleteSurvey) {
        this.las2peer
          .deleteSurvey(surveyId)
          .catch((error) => console.error(error));
      }
      if (result.deleteMeasures) {
        const measureTag = `surveyId=${surveyId}`;
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
  }

  private async createNewSurvey(
    questionnaire: IQuestionnaire,
    addMeasures: boolean,
    assignMeasures: boolean,
  ): Promise<void> {
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
    try {
      const response = await this.las2peer.createSurvey(
        surveyName,
        questionnaire.description,
        this.group.name,
        questionnaire.logo,
        QuestionnairesComponent.nowAsIsoDate(),
        QuestionnairesComponent.in100YearsAsIsoDate(),
        serviceName,
        this.service.alias,
        questionnaire.lang,
      );
      if (!response || !('id' in response)) {
        throw new Error('Invalid survey id: undefined');
      }

      const surveyId = parseInt((response as { id: string }).id, 10);

      await this.las2peer.setQuestionnaireForSurvey(
        questionnaire.id,
        surveyId,
      );

      const q = new QuestionnaireModel(
        questionnaire.name,
        questionnaire.id,
        surveyId,
      );

      this.ngrxStore.dispatch(
        addQuestionnaireToModel({ questionnaire: q }),
      );

      if (addMeasures) {
        const [newModel, newMeasures] =
          QuestionnairesComponent.addMeasuresFromQuestionnaireToModel(
            questionnaire,
            surveyId,
            assignMeasures,
            this.service,
            this.measures,
            this.model,
          );
        this.ngrxStore.dispatch(
          addModelToWorkSpace({
            xml: SuccessModel.fromPlainObject(newModel).toXml()
              .outerHTML,
          }),
        );
        this.ngrxStore.dispatch(
          addCatalogToWorkspace({
            xml: new MeasureCatalog(newMeasures).toXml().outerHTML,
          }),
        );
      }
    } catch (error) {
      console.error(error);
    }
  }
}
