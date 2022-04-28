import { Component, Input, OnInit } from '@angular/core';
import { RemoveSurveyDialogComponent } from './remove-survey-dialog/remove-survey-dialog.component';
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
  SUCCESS_MODEL,
  QUESTIONNAIRE,
  MEASURE_CATALOG,
} from 'src/app/services/store/store.selectors';
import { ServiceInformation } from 'src/app/models/service.model';

import {
  SuccessFactor,
  SuccessModel,
} from 'src/app/models/success.model';
import {
  Question,
  Questionnaire,
} from 'src/app/models/questionnaire.model';
import {
  Measure,
  MeasureCatalog,
  MeasureMap,
  SQLQuery,
} from 'src/app/models/measure.model';

import {
  ChartVisualization,
  ValueVisualization,
} from 'src/app/models/visualization.model';
import {
  joinAbsoluteUrlPath,
  Las2peerService,
} from 'src/app/services/las2peer.service';
import { firstValueFrom, Observable } from 'rxjs';
import {
  addSurveyToModel,
  addModelToWorkSpace,
  addCatalogToWorkspace,
  removeSurveyFromModel,
  removeSurveyMeasuresFromModel,
  fetchSurveys,
  fetchQuestionnaireForm,
  fetchQuestionnaires,
} from 'src/app/services/store/store.actions';
import { environment } from 'src/environments/environment';
import { take } from 'rxjs/operators';

import { Survey } from 'src/app/models/survey.model';
import { PickSurveyDialogComponent } from './pick-survey-dialog/pick-survey-dialog.component';
import { QuestionnaireInfoDialogComponent } from 'src/app/shared/dialogs/questionnaire-info-dialog/questionnaire-info-dialog.component';
import { TranslateService } from '@ngx-translate/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-surveys',
  templateUrl: './surveys.component.html',
  styleUrls: ['./surveys.component.scss'],
})
export class SurveyComponent implements OnInit {
  @Input() model$: Observable<SuccessModel>;

  measures$ = this.ngrxStore.select(MEASURES);
  service$ = this.ngrxStore.select(SELECTED_SERVICE);
  editMode$ = this.ngrxStore.select(EDIT_MODE);
  questionnaires$ = this.ngrxStore.select(QUESTIONNAIRES);
  canEdit$ = this.ngrxStore.select(USER_HAS_EDIT_RIGHTS);
  group$ = this.ngrxStore.select(SELECTED_GROUP);

  mobsosSurveysUrl = environment.mobsosSurveysUrl;
  surveys: any;

  private availableQuestionnaires: Questionnaire[];

  constructor(
    private dialog: MatDialog,
    private las2peer: Las2peerService,
    private translate: TranslateService,
    private _snackBar: MatSnackBar,

    private ngrxStore: Store,
  ) {}

  getQuestionnaireByName(name: string): Questionnaire {
    return this.availableQuestionnaires?.find(
      (value) => value.name === name,
    );
  }

  async openPickSurveyDialog(): Promise<void> {
    const { selectedSurvey, addMeasures, assignMeasures } =
      await firstValueFrom(
        this.dialog.open(PickSurveyDialogComponent).afterClosed(),
      );
    if (selectedSurvey) {
      this.ngrxStore.dispatch(
        addSurveyToModel({
          survey: selectedSurvey,
          addMeasures,
          assignMeasures,
        }),
      );
      if (addMeasures) {
        const questionnaire = await firstValueFrom(
          this.ngrxStore
            .select(QUESTIONNAIRE({ qid: selectedSurvey.qid }))
            .pipe(take(1)),
        );
        const service = await firstValueFrom(
          this.ngrxStore.select(SELECTED_SERVICE).pipe(take(1)),
        );
        const currentModel = await firstValueFrom(
          this.ngrxStore.select(SUCCESS_MODEL).pipe(take(1)),
        );
        const currentCatalog = await firstValueFrom(
          this.ngrxStore.select(MEASURE_CATALOG).pipe(take(1)),
        );
        const { model, measures } =
          addMeasuresFromQuestionnaireToModelAndCatalog(
            questionnaire,
            selectedSurvey.id as number,
            addMeasures,
            service,
            cloneDeep(currentCatalog.measures) as MeasureMap,
            cloneDeep(currentModel) as SuccessModel,
          );
        this.ngrxStore.dispatch(
          addCatalogToWorkspace({
            xml: new MeasureCatalog(measures).toXml().outerHTML,
          }),
        );
        if (assignMeasures) {
          this.ngrxStore.dispatch(
            addModelToWorkSpace({
              xml: SuccessModel.fromPlainObject(model).toXml()
                .outerHTML,
            }),
          );
        }
      }
    }
  }

  async openRemoveQuestionnaireDialog(
    questionnaireIndex: number,
  ): Promise<void> {
    const dialogRef = this.dialog.open(RemoveSurveyDialogComponent, {
      minWidth: 300,
    });
    const result = (await dialogRef.afterClosed().toPromise()) as {
      deleteSurvey: boolean;
      deleteMeasures: boolean;
    };
    const model = (await firstValueFrom(
      this.ngrxStore.select(SUCCESS_MODEL).pipe(take(1)),
    )) as any;
    if (result) {
      const surveyId: number =
        model.surveys[questionnaireIndex].qid ||
        model.surveys[questionnaireIndex].surveyId;
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
        removeSurveyFromModel({
          id: surveyId,
        }),
      );
    }
  }

  shareSurveyLink(surveyId: number) {
    const base = environment.mobsosSurveysUrl;
    const link = joinAbsoluteUrlPath(base, 'surveys', surveyId);

    void navigator.clipboard.writeText(link);
    const message = this.translate.instant(
      'copied-to-clipboard',
    ) as string;
    this._snackBar.open(message, undefined, { duration: 3000 });
  }

  ngOnInit(): void {
    this.ngrxStore.dispatch(fetchSurveys());
    this.ngrxStore.dispatch(fetchQuestionnaires());
  }

  async openInfoDialog(survey: Survey) {
    const questionnaires = await firstValueFrom(
      this.ngrxStore.select(QUESTIONNAIRES).pipe(take(1)),
    );
    const desiredQuestionnaire = questionnaires.find(
      (q) => q.id === survey.qid,
    );
    this.dialog.open(QuestionnaireInfoDialogComponent, {
      data: { ...desiredQuestionnaire, surveyId: survey.id },
    });
  }
}

function extractQuestions(
  formXML: string,
  service: ServiceInformation,
): Question[] {
  const result: Question[] = [];
  const xml = parseXml(formXML);
  let pages = Array.from(xml.getElementsByTagName('qu:Page'));
  pages = pages.filter((page) => {
    const type = page.getAttribute('xsi:type');
    return (
      type === 'qu:OrdinalScaleQuestionPageType' ||
      type === 'qu:DichotomousQuestionPageType'
    );
  });
  for (const page of pages) {
    const minLabel = page.getAttribute('minlabel');
    const maxLabel = page.getAttribute('maxlabel');
    const labels = { minLabel, maxLabel };
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
      labels,
    });
  }
  return result;
}

function parseXml(xml: string): Document {
  const parser = new DOMParser();
  return parser.parseFromString(xml, 'text/xml');
}

function getChartSQL(surveyId: number, question: Question) {
  const dbName = environment.mobsosSurveysDatabaseName;

  if (question.type === 'ordinal') {
    return `SELECT qval AS Answer, COUNT(*) as number FROM ${dbName}.response WHERE  sid=${
      SqlString.escape(surveyId.toString()) as string
    } AND qkey = "${
      question.code
    }" GROUP BY Answer ORDER BY number DESC`;
  } else {
    // eslint-disable-next-line @typescript-eslint/dot-notation
    return `SELECT if(qval, '${question.labels.maxLabel}',  '${
      question.labels.minLabel
    }') AS Answer, COUNT(*) as number FROM ${dbName}.response WHERE  sid=${
      SqlString.escape(surveyId.toString()) as string
    } AND qkey = "${
      question.code
    }" GROUP BY Answer ORDER BY number DESC`;
  }
}

function generateChartMeasure(
  questionnaire: Questionnaire,
  surveyId: number,
  question: Question,
): Measure {
  const measureName =
    questionnaire.name + ': ' + question.instructions;

  const chartMeasureQuery = getChartSQL(surveyId, question);

  const chartMeasure = new Measure(
    measureName,
    [new SQLQuery('Answer Distribution', chartMeasureQuery)],
    new ChartVisualization(
      question.type === 'dichotomous' ? 'PieChart' : 'BarChart',
      measureName,
      measureName,
      '300px',
      '300px',
    ),
    ['surveyId=' + surveyId.toString(), 'generated'],
  );
  return chartMeasure;
}

function getMeanValueSQL(surveyId: number, question: Question) {
  if (question.type !== 'ordinal') return;
  const dbName = environment.mobsosSurveysDatabaseName;

  return `SELECT AVG(qval) as number FROM ${dbName}.response WHERE  sid=${
    SqlString.escape(surveyId.toString()) as string
  } AND qkey = "${question.code}"`;
}
function addMeasuresFromQuestionnaireToModelAndCatalog(
  questionnaire: Questionnaire,
  surveyId: number,
  assignMeasures,
  service: ServiceInformation,
  measures: MeasureMap,
  model: SuccessModel,
): { model: SuccessModel; measures: MeasureMap } {
  this.ngrxStore.dispatch(
    fetchQuestionnaireForm({ questionnaireId: questionnaire.id }),
  );
  // const formXML = firstValueFrom( this.ngrxStore.select(QUESIONNAIRE({id:questionnaire.id})).pipe(take(1)));
  const questions = extractQuestions(questionnaire.formXML, service);

  for (const question of questions) {
    const chartMeasure = generateChartMeasure(
      questionnaire,
      surveyId,
      question,
    );

    measures[chartMeasure.name] = chartMeasure;
    if (
      assignMeasures &&
      question.dimensionRecommendation &&
      question.factorRecommendation
    ) {
      let dimension = model.dimensions[
        question.dimensionRecommendation
      ] as SuccessFactor[];
      dimension = assignMeasuresToDimension(
        question,
        chartMeasure.name,
        dimension,
      );
      model[question.dimensionRecommendation] = dimension;
    }

    if (question.type === 'ordinal') {
      const meanValueMeasure = getMeanValueMeasure(
        questionnaire,
        surveyId,
        question,
      );
      measures[meanValueMeasure.name] = meanValueMeasure;
      if (
        assignMeasures &&
        question.dimensionRecommendation &&
        question.factorRecommendation
      ) {
        let dimension = model.dimensions[
          question.dimensionRecommendation
        ] as SuccessFactor[];
        dimension = assignMeasuresToDimension(
          question,
          meanValueMeasure.name,
          dimension,
        );
        model[question.dimensionRecommendation] = dimension;
      }
    }
  }
  return { model, measures };
}

function getMeanValueMeasure(
  questionnaire: Questionnaire,
  surveyId: number,
  question: Question,
) {
  const meanValueMeasureName = `${questionnaire.name}: ${question.instructions} (Mean Value)`;
  const meanValueMeasureQuery = getMeanValueSQL(surveyId, question);

  const meanValueMeasure = new Measure(
    meanValueMeasureName,
    [new SQLQuery('Mean Value', meanValueMeasureQuery)],
    new ValueVisualization(),
    ['surveyId=' + surveyId.toString(), 'generated'],
  );
  return meanValueMeasure;
}

function assignMeasuresToDimension(
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
    dimension.push(targetFactor);
  }
  targetFactor.measures.push(measureName);

  return dimension;
}
