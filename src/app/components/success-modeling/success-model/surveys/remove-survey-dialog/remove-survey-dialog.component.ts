import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-remove-survey-dialog',
  templateUrl: './remove-survey-dialog.component.html',
  styleUrls: ['./remove-survey-dialog.component.scss'],
})
export class RemoveSurveyDialogComponent {
  deleteSurvey = false;
  deleteMeasures = true;

  constructor() {}
}
