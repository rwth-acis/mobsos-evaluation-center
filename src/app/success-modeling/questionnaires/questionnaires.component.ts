import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {MeasureMap} from '../../../success-model/measure-catalog';
import {ServiceInformation, StoreService} from '../../store.service';
import {SuccessModel} from '../../../success-model/success-model';
import {Las2peerService, Questionnaire} from '../../las2peer.service';
import { MatDialog } from '@angular/material/dialog';
import {PickQuestionnaireDialogComponent} from './pick-questionnaire-dialog/pick-questionnaire-dialog.component';
import {Questionnaire as QuestionnairModel} from '../../../success-model/questionnaire';
import {environment} from '../../../environments/environment';
import {DeleteQuestionnaireDialogComponent} from './delete-questionnaire-dialog/delete-questionnaire-dialog.component';
import {NGXLogger} from 'ngx-logger';
import {SuccessFactor} from '../../../success-model/success-factor';
import {Measure} from '../../../success-model/measure';
import * as SqlString from 'sqlstring';
import {ChartVisualization} from '../../../success-model/visualization';
import {Query} from '../../../success-model/query';

@Component({
  selector: 'app-questionnaires',
  templateUrl: './questionnaires.component.html',
  styleUrls: ['./questionnaires.component.scss']
})
export class QuestionnairesComponent implements OnInit {

  @Input() availableQuestionnaires: Questionnaire[];
  @Input() measures: MeasureMap;
  @Input() model: SuccessModel;
  @Input() service: ServiceInformation;
  @Input() editMode = false;
  @Input() groupID: string;
  @Output() measuresChange = new EventEmitter<MeasureMap>();
  @Output() modelChange = new EventEmitter<SuccessModel>();
  mobsosSurveysUrl = environment.mobsosSurveysUrl;

  constructor(private dialog: MatDialog, private las2peer: Las2peerService, private logger: NGXLogger,
              private store: StoreService) {
  }

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
  }

  openPickQuestionnaireDialog() {
    // remove questionnaires that already have been chosen
    const questionnaires = this.availableQuestionnaires.filter(questionnaire => {
      for (const modelQuestionnaire of this.model.questionnaires) {
        if (modelQuestionnaire.id === questionnaire.id) {
          return false;
        }
      }
      return true;
    });
    const dialogRef = this.dialog.open(PickQuestionnaireDialogComponent, {
      minWidth: 300,
      width: '80%',
      data: questionnaires,
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const questionnaire = result.selectedQuestionnaire as Questionnaire;
        let serviceName = this.service.name;
        if (serviceName.includes('@')) {
          serviceName = serviceName.split('@')[0];
        }
        const surveyName = this.service.alias + ': ' + questionnaire.name + '(' + QuestionnairesComponent.nowAsIsoDate() + ')';
        this.las2peer.createSurvey(surveyName,
          questionnaire.description, this.store.getGroupById(this.groupID).name, questionnaire.logo,
          QuestionnairesComponent.nowAsIsoDate(), QuestionnairesComponent.in100YearsAsIsoDate(),
          serviceName, this.service.alias, questionnaire.lang).then(response => {
          const surveyId = parseInt((response as { id: string }).id, 10);
          this.las2peer.setQuestionnaireForSurvey(questionnaire.id, surveyId).then(() => {
            this.model.questionnaires.push(new QuestionnairModel(questionnaire.name, questionnaire.id, surveyId));

            if (result.addMeasures) {
              const questions = this.extractQuestions(questionnaire.formXML);
              for (const question of questions) {
                const measureName = questionnaire.name + ': ' + question.instructions;
                const query = 'SELECT JSON_EXTRACT(REMARKS,"$.qval") AS Answer, COUNT(*) FROM MESSAGE m ' +
                  'WHERE m.EVENT = "SERVICE_CUSTOM_MESSAGE_1" AND JSON_EXTRACT(REMARKS,"$.sid") = ' + SqlString.escape(surveyId) +
                  ' AND JSON_EXTRACT(REMARKS,"$.qkey") = "' + question.code + '" GROUP BY JSON_EXTRACT(REMARKS,"$.qval")';
                const measure = new Measure(
                  measureName,
                  [new Query('Answer Distribution', query)],
                  new ChartVisualization('BarChart', measureName, measureName, '300px', '300px'),
                  ['surveyId=' + surveyId, 'generated']);
                this.measures[measureName] = measure;
                if (result.assignMeasures && question.dimensionRecommendation && question.factorRecommendation) {
                  const dimension = this.model.dimensions[question.dimensionRecommendation];
                  let targetFactor: SuccessFactor;
                  for (const factor of dimension as SuccessFactor[]) {
                    if (factor.name === question.factorRecommendation) {
                      targetFactor = factor;
                      break;
                    }
                  }
                  if (!targetFactor) {
                    targetFactor = new SuccessFactor(question.factorRecommendation, []);
                  }
                  targetFactor.measures.push(measureName);
                  dimension.push(targetFactor);
                }
              }
            }

            this.measuresChange.emit(this.measures);
            this.modelChange.emit(this.model);
          });
        });
      }
    });
  }

  async openRemoveQuestionnaireDialog(questionnaireIndex: number) {
    const dialogRef = this.dialog.open(DeleteQuestionnaireDialogComponent, {
      minWidth: 300
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const surveyId = this.model.questionnaires[questionnaireIndex].surveyId;
        if (result.deleteSurvey) {
          this.las2peer.deleteSurvey(surveyId).catch(
            error => this.logger.error(error)
          );
        }
        if (result.deleteMeasures) {
          const measureTag = 'surveyId=' + surveyId;
          const measureNamesToBeRemoved = Object.keys(this.measures).filter(
            measureName => this.measures[measureName].tags.includes(measureTag));
          for (const dimension of Object.values(this.model.dimensions)) {
            // collect empty factors here
            const factorsToBeRemoved = [];
            for (const factor of (dimension as SuccessFactor[])) {
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
              const index = (dimension as SuccessFactor[]).indexOf(factor);
              (dimension as SuccessFactor[]).splice(index, 1);
            }
          }
        }
        this.model.questionnaires.splice(questionnaireIndex, 1);
        this.modelChange.emit(this.model);
      }
    });
  }

  private getQuestionnaireByName(name: string): Questionnaire {
    if (!this.availableQuestionnaires) {
      return null;
    }
    return this.availableQuestionnaires.find(value => value.name === name);
  }

  private extractQuestions(formXML: string):
    {
      code: string; type: 'ordinal' | 'dichotomous'; dimensionRecommendation: string; factorRecommendation: string;
      instructions: string
    }[] {
    const result = [];
    const xml = QuestionnairesComponent.parseXml(formXML);
    let pages = Array.from(xml.getElementsByTagName('qu:Page'));
    pages = pages.filter(page => {
      const type = page.getAttribute('xsi:type');
      return type === 'qu:OrdinalScaleQuestionPageType' || type === 'qu:DichotomousQuestionPageType';
    });
    for (const page of pages) {
      const code = page.getAttribute('qid');
      let type: string;
      if (page.getAttribute('xsi:type') === 'qu:OrdinalScaleQuestionPageType') {
        type = 'ordinal';
      } else {
        type = 'dichotomous';
      }
      let dimensionRecommendation: string = null;
      let factorRecommendation: string = null;
      const recommendations = Array.from(page.getElementsByTagName('qu:SuccessModelRecommendation'));
      if (recommendations.length > 0) {
        const recommendation = recommendations[0];
        dimensionRecommendation = recommendation.getAttribute('dimension');
        factorRecommendation = recommendation.getAttribute('factor');
      }
      const instructionsElement = Array.from(page.getElementsByTagName('qu:Instructions'))[0];
      const instructions = instructionsElement.innerHTML.trim()
        .replace('${SURVEY.RESOURCE}', this.service.alias);
      result.push({code, type, dimensionRecommendation, factorRecommendation, instructions});
    }
    return result;
  }
}
