import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { startWith } from 'rxjs/operators';

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
    query: ['SELECT * FROM MESSAGE limit 1'],
    updateOn: 'blur',
  });

  queryInput$ = this.form
    .get('query')
    .valueChanges.pipe(startWith('SELECT * FROM MESSAGE limit 1'));

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {}

  onSubmit() {}
}
