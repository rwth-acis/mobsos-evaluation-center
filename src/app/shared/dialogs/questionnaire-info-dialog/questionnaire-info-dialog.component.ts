import { Component, Inject } from '@angular/core';
import {
  MatLegacyDialogRef as MatDialogRef,
  MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA,
} from '@angular/material/legacy-dialog';
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
