import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';

@Component({
  selector: 'app-query-visualization',
  templateUrl: './query-visualization.component.html',
  styleUrls: ['./query-visualization.component.scss'],
})
export class QueryVisualizationComponent implements OnInit {
  visualizationChoices = {
    Value: 'success-modeling.edit-measure-dialog.choice-value',
    Chart: 'success-modeling.edit-measure-dialog.choice-chart',
    Table: 'query-visualization.choice-table',
  };

  form = this.fb.group({
    query: [''],
    updateOn: 'blur',
  });

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {}

  onSubmit() {}
}
