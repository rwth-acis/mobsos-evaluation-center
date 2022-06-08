import { Component, Inject } from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { Questionnaire } from 'src/app/models/questionnaire.model';

@Component({
  selector: 'app-questionnaire-info-dialog',
  templateUrl: './questionnaire-info-dialog.component.html',
  styleUrls: ['./questionnaire-info-dialog.component.scss'],
})
export class QuestionnaireInfoDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<QuestionnaireInfoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Questionnaire,
  ) {}
}
