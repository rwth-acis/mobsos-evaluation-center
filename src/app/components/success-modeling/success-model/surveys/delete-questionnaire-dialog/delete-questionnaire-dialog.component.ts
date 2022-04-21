import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-delete-questionnaire-dialog',
  templateUrl: './delete-questionnaire-dialog.component.html',
  styleUrls: ['./delete-questionnaire-dialog.component.scss']
})
export class DeleteQuestionnaireDialogComponent implements OnInit {
  deleteSurvey = true;
  deleteMeasures = true;

  constructor() { }

  ngOnInit() {
  }

}
