import { Component, Inject, OnInit } from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import {
  IQuestionnaire,
  Questionnaire,
} from 'src/app/models/questionnaire.model';

@Component({
  selector: 'app-questionnaire-info-dialog',
  templateUrl: './questionnaire-info-dialog.component.html',
  styleUrls: ['./questionnaire-info-dialog.component.scss'],
})
export class QuestionnaireInfoDialogComponent implements OnInit {
  constructor(
    public dialogRef: MatDialogRef<QuestionnaireInfoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: IQuestionnaire,
  ) {}

  ngOnInit(): void {}
}
