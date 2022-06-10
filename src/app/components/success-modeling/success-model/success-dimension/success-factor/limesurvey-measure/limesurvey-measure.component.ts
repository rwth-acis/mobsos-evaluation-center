import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import {
  filter,
  map,
  Observable,
  switchMap,
  withLatestFrom,
} from 'rxjs';
import {
  LimeSurveyMeasure,
  Measure,
} from 'src/app/models/measure.model';
import {
  VisualizationData,
  Visualization,
} from 'src/app/models/visualization.model';
import {
  MEASURE,
  RESPONSES_FOR_LIMESURVEY,
} from 'src/app/services/store/store.selectors';

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

  data$: Observable<any>;
  visualzation$: Observable<Visualization>;
  measure$: Observable<LimeSurveyMeasure>;
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
        map((measure) =>
          LimeSurveyMeasure.fromJSON(measure as LimeSurveyMeasure),
        ),
      );

    const responses$ = this.measure$.pipe(
      switchMap((m) =>
        this.ngrxStore.select(
          RESPONSES_FOR_LIMESURVEY({ sid: m.sid }),
        ),
      ),
    );

    this.data$ = this.measure$.pipe(
      withLatestFrom(responses$),
      map(([measure, responses]) => {
        responses;
      }),
    );
  }
}
