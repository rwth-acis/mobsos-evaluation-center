import { Component, Inject, OnInit } from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { Survey } from 'src/app/models/survey.model';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-pick-survey-dialog',
  templateUrl: './pick-survey-dialog.component.html',
  styleUrls: ['./pick-survey-dialog.component.scss'],
})
export class PickSurveyDialogComponent implements OnInit {
  selectedSurvey: Survey;
  addMeasures: boolean;
  assignMeasures: boolean;
  mobsosSurveysUrl = environment.mobsosSurveysUrl;
  surveys: Survey[];
  constructor(
    public dialogRef: MatDialogRef<PickSurveyDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data: { surveys: Survey[] },
  ) {
    this.surveys = data.surveys;
  }

  ngOnInit(): void {}
  onAddMeasuresChange(e) {}
  closeDialog() {
    this.dialogRef.close({
      selectedSurvey: this.selectedSurvey,
      addMeasures: this.addMeasures,
      assignMeasures: this.assignMeasures,
    });
  }
}
