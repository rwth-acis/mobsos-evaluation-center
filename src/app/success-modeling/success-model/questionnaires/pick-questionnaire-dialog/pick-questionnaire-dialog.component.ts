import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

import { Store } from '@ngrx/store';
import { Questionnaire } from 'src/app/models/questionnaire.model';
import { SURVEYS_NOT_IN_MODEL } from 'src/app/services/store.selectors';
import { environment } from 'src/environments/environment';

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
  questionnaires$ = this.ngrxStore.select(SURVEYS_NOT_IN_MODEL);
  range = new FormGroup({
    start: new FormControl(),
    end: new FormControl(),
  });

  constructor(private ngrxStore: Store) {}

  static parseXml(xml: string): Document {
    const parser = new DOMParser();
    return parser.parseFromString(xml, 'text/xml');
  }

  private static getTranslateStringForDimensionName(value: string) {
    switch (value) {
      case 'System Quality':
        return 'success-modeling.dimensions.system-quality';
      case 'Information Quality':
        return 'success-modeling.dimensions.information-quality';
      case 'Use':
        return 'success-modeling.dimensions.use';
      case 'User Satisfaction':
        return 'success-modeling.dimensions.user-satisfaction';
      case 'Individual Impact':
        return 'success-modeling.dimensions.individual-impact';
      case 'Community Impact':
        return 'success-modeling.dimensions.community-impact';
      default:
        return value;
    }
  }

  ngOnInit(): void {}

  getNumberOfQuestions(): number {
    if (!this.selectedQuestionnaire) {
      return null;
    }
    const xml = PickQuestionnaireDialogComponent.parseXml(
      this.selectedQuestionnaire.formXML,
    );
    return Array.from(xml.getElementsByTagName('qu:Page'))?.length;
  }

  getDimensions(): string[] {
    if (!this.selectedQuestionnaire) {
      return [];
    }
    const xml = PickQuestionnaireDialogComponent.parseXml(
      this.selectedQuestionnaire.formXML,
    );
    const successModelRecommendations = Array.from(
      xml.getElementsByTagName('qu:SuccessModelRecommendation'),
    );
    const resultSet = new Set<string>();
    for (const recommendation of successModelRecommendations) {
      resultSet.add(recommendation.getAttribute('dimension'));
    }
    let result: string[] = [];
    resultSet.forEach((value) => {
      const translateStringValue =
        PickQuestionnaireDialogComponent.getTranslateStringForDimensionName(
          value,
        );
      result.push(translateStringValue);
    });
    result = result.sort();
    return result;
  }

  onAddMeasuresChange(addMeasures: boolean): void {
    if (!addMeasures) {
      this.assignMeasures = false;
    }
    this.addMeasures = addMeasures;
  }
}
