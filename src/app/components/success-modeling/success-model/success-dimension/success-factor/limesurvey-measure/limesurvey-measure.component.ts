import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { ChartType } from 'angular-google-charts';
import {
  combineLatest,
  filter,
  firstValueFrom,
  map,
  Observable,
  Subscription,
  switchMap,
  withLatestFrom,
} from 'rxjs';
import {
  IMeasure,
  LimeSurveyMeasure,
  Measure,
  SQLQuery,
} from 'src/app/models/measure.model';
import { ServiceInformation } from 'src/app/models/service.model';
import {
  VisualizationData,
  Visualization,
  ChartVisualization,
} from 'src/app/models/visualization.model';
import { removeMeasureFromModel } from 'src/app/services/store/store.actions';
import {
  MEASURE,
  RESPONSES_FOR_LIMESURVEY,
  RESPONSES_FOR_LIMESURVEY_QUESTION,
  SELECTED_SERVICE,
  USER_HAS_EDIT_RIGHTS,
} from 'src/app/services/store/store.selectors';
import { ConfirmationDialogComponent } from 'src/app/shared/dialogs/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-limesurvey-measure',
  templateUrl: './limesurvey-measure.component.html',
  styleUrls: ['./limesurvey-measure.component.scss'],
})
export class LimesurveyMeasureComponent implements OnInit {
  @Input() measureName: string;
  @Input() dimensionName = '';
  @Input() factorName = '';
  @Input() preview = false;

  data$: Observable<VisualizationData>;
  visualzation$: Observable<Visualization>;
  measure$: Observable<LimeSurveyMeasure>;
  service$: Observable<ServiceInformation> =
    this.ngrxStore.select(SELECTED_SERVICE);
  subscriptions$: Subscription[] = [];
  canEdit$ = this.ngrxStore.select(USER_HAS_EDIT_RIGHTS);
  queries$: Observable<SQLQuery[]>;
  description$: Observable<string>;

  constructor(
    private translate: TranslateService,
    private dialog: MatDialog,
    private ngrxStore: Store,
  ) {}

  ngOnInit(): void {
    this.measure$ = this.ngrxStore
      .select(MEASURE({ measureName: this.measureName }))
      .pipe(
        filter((measure) => !!measure),
        map((measure) => measure as LimeSurveyMeasure),
      );

    const responseData$ = this.measure$.pipe(
      switchMap((m) => {
        if (!m.sid) {
          console.error('No survey id found for measure', m);
        }
        return this.ngrxStore.select(
          RESPONSES_FOR_LIMESURVEY_QUESTION({
            sid: m.sid,
            statement: m.title,
          }),
        );
      }),
    );
    this.data$ = responseData$.pipe(
      map(({ responses }) => {
        const table = [];
        const columnLabels = ['answer', 'count'];
        const firstKey = Object.keys(responses)[0];
        const columnTypes = [
          typeof firstKey,
          typeof responses[firstKey],
        ];
        table.push(columnLabels);
        table.push(columnTypes);
        const data = Object.entries(responses)
          .map(([key, value]) =>
            !!key ? [key, value] : ['undetermined', value],
          )
          .sort((row_a, row_b) => {
            const a = row_a[0];
            const b = row_b[0];
            if (a < b) {
              return -1;
            }
            if (a > b) {
              return 1;
            }
            return 0;
          });
        return {
          data: table.concat(data),
          fetchDate: new Date().toISOString(),
        };
      }),
    );

    this.visualzation$ = responseData$.pipe(
      map(({ type }) => {
        switch (type) {
          case '5':
            return new ChartVisualization(ChartType.BarChart);
          case 'L':
            return new ChartVisualization(ChartType.PieChart);
          case 'Y':
            return new ChartVisualization(ChartType.PieChart);
        }
        return null;
      }),
    );
  }

  async onDeleteClicked(measure, $event: MouseEvent): Promise<void> {
    const message = this.translate.instant(
      'success-factor.remove-measure-prompt',
    );
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      minWidth: 300,
      data: message,
    });

    const result = await firstValueFrom(dialogRef.afterClosed());
    if (result) {
      this.ngrxStore.dispatch(
        removeMeasureFromModel({ name: measure.name }),
      );
    }
    $event.stopPropagation();
  }
}
