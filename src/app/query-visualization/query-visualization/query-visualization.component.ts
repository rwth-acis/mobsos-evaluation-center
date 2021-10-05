import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { startWith } from 'rxjs/operators';

@Component({
  selector: 'app-query-visualization',
  templateUrl: './query-visualization.component.html',
  styleUrls: ['./query-visualization.component.scss'],
})
export class QueryVisualizationComponent implements OnInit {
  static initialValue = 'SELECT ID, REMARKS FROM MESSAGE limit 10';
  visualizationChoices = {
    Value: 'success-modeling.edit-measure-dialog.choice-value',
    Chart: 'success-modeling.edit-measure-dialog.choice-chart',
    Table: 'query-visualization.choice-table',
  };

  form = this.fb.group(
    { query: [QueryVisualizationComponent.initialValue] },
    { updateOn: 'blur' },
  );

  queryInput$ = this.form
    .get('query')
    .valueChanges.pipe(
      startWith(QueryVisualizationComponent.initialValue),
    );

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {}

  onSubmit() {}
}
