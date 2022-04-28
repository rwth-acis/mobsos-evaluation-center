import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

import { Store } from '@ngrx/store';
import {
  catchError,
  firstValueFrom,
  map,
  of,
  take,
  timeout,
} from 'rxjs';
import { Questionnaire } from 'src/app/models/questionnaire.model';
import { StateEffects } from 'src/app/services/store/store.effects';
import { QUESTIONNAIRES } from 'src/app/services/store/store.selectors';
import { environment } from 'src/environments/environment';
import {
  failureResponse,
  fetchQuestionnaireForm,
  storeQuestionnaireForm,
} from '../../../../../services/store/store.actions';
import { MatSelectChange } from '@angular/material/select';

@Component({
  selector: 'app-pick-questionnaire-dialog',
  templateUrl: './pick-questionnaire-dialog.component.html',
  styleUrls: ['./pick-questionnaire-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PickQuestionnaireDialogComponent implements OnInit {
  selectedQuestionnaire: Questionnaire;
  addMeasures = true;
  assignMeasures = true;
  mobsosSurveysUrl = environment.mobsosSurveysUrl;
  questionnaires$ = this.ngrxStore.select(QUESTIONNAIRES);
  range = new FormGroup({
    start: new FormControl(),
    end: new FormControl(),
  });

  constructor(
    private ngrxStore: Store,
    private effects: StateEffects,
  ) {}

  static parseXml(xml: string): Document {
    const parser = new DOMParser();
    return parser.parseFromString(xml, 'text/xml');
  }

  // private static getTranslateStringForDimensionName(value: string) {
  //   switch (value) {
  //     case 'System Quality':
  //       return 'success-modeling.dimensions.system-quality';
  //     case 'Information Quality':
  //       return 'success-modeling.dimensions.information-quality';
  //     case 'Use':
  //       return 'success-modeling.dimensions.use';
  //     case 'User Satisfaction':
  //       return 'success-modeling.dimensions.user-satisfaction';
  //     case 'Individual Impact':
  //       return 'success-modeling.dimensions.individual-impact';
  //     case 'Community Impact':
  //       return 'success-modeling.dimensions.community-impact';
  //     default:
  //       return value;
  //   }
  // }

  ngOnInit(): void {}

  async fetchForm(event: MatSelectChange) {
    this.selectedQuestionnaire = Questionnaire.fromJSONObject(
      event.value,
    );
    if (!this.selectedQuestionnaire.formXML) {
      this.ngrxStore.dispatch(
        fetchQuestionnaireForm({
          questionnaireId: this.selectedQuestionnaire.id,
        }),
      );
      const result = await firstValueFrom(
        this.effects.fetchQuestionnaireForm$.pipe(
          timeout(300000),
          take(1),
          catchError(() => {
            return of(
              failureResponse({
                reason: new HttpErrorResponse({
                  error: 'The request took too long and was aborted',
                }),
              }),
            );
          }),
        ),
      );

      if (result instanceof HttpErrorResponse) {
        throw result;
      }

      const xml = (result as { formXML: string }).formXML;
      this.selectedQuestionnaire.formXML = xml;
      event.source.writeValue(this.selectedQuestionnaire);
    }
  }

  // async getNumberOfQuestions() {
  //   if (!this.selectedQuestionnaire) {
  //     return null;
  //   }
  //   const xmlForm = await this.fetchForm();
  //   this.selectedQuestionnaire.formXML = xmlForm;
  //   const doc = PickQuestionnaireDialogComponent.parseXml(xmlForm);
  //   return Array.from(doc.getElementsByTagName('qu:Page'))?.length;
  // }

  // async getDimensions() {
  //   if (!this.selectedQuestionnaire) {
  //     return [];
  //   }
  //   const xmlForm = await this.fetchForm();
  //   this.selectedQuestionnaire.formXML = xmlForm;
  //   const xml = PickQuestionnaireDialogComponent.parseXml(xmlForm);
  //   const successModelRecommendations = Array.from(
  //     xml.getElementsByTagName('qu:SuccessModelRecommendation'),
  //   );
  //   const resultSet = new Set<string>();
  //   for (const recommendation of successModelRecommendations) {
  //     resultSet.add(recommendation.getAttribute('dimension'));
  //   }
  //   let result: string[] = [];
  //   resultSet.forEach((value) => {
  //     const translateStringValue =
  //       PickQuestionnaireDialogComponent.getTranslateStringForDimensionName(
  //         value,
  //       );
  //     result.push(translateStringValue);
  //   });
  //   result = result.sort();
  //   return result;
  // }

  onAddMeasuresChange(addMeasures: boolean): void {
    if (!addMeasures) {
      this.assignMeasures = false;
    }
    this.addMeasures = addMeasures;
  }
}
