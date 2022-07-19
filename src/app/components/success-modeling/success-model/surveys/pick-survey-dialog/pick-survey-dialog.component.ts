import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import { UntypedFormBuilder } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatChipEvent } from '@angular/material/chips';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import {
  combineLatest,
  firstValueFrom,
  map,
  Observable,
  take,
  startWith,
} from 'rxjs';
import { Questionnaire } from 'src/app/models/questionnaire.model';
import {
  ISurvey,
  LimeSurvey,
  Survey,
} from 'src/app/models/survey.model';
import {
  joinAbsoluteUrlPath,
  Las2peerService,
} from 'src/app/services/las2peer.service';
import { fetchResponsesForSurveyFromLimeSurvey } from 'src/app/services/store/store.actions';
import {
  SURVEYS_NOT_IN_MODEL,
  SELECTED_GROUP,
  SELECTED_SERVICE,
  USER,
  QUESTIONNAIRES,
  EXPERT_MODE,
} from 'src/app/services/store/store.selectors';
import { environment } from 'src/environments/environment';
import { PickQuestionnaireDialogComponent } from '../pick-questionnaire-dialog/pick-questionnaire-dialog.component';
interface PickQuestionnaireResult {
  selectedQuestionnaire: Questionnaire;
  addMeasures: boolean;
  assignMeasures: boolean;
  start: Date;
  end: Date;
}

@Component({
  selector: 'app-pick-survey-dialog',
  templateUrl: './pick-survey-dialog.component.html',
  styleUrls: ['./pick-survey-dialog.component.scss'],
})
export class PickSurveyDialogComponent implements OnInit {
  @ViewChild('inputRef', { static: true })
  inputRef: ElementRef<HTMLInputElement>;

  expertMode$ = this.ngrxStore.select(EXPERT_MODE);
  addMeasures = true;
  assignMeasures = true;
  mobsosSurveysUrl = environment.mobsosSurveysUrl;
  filteredOptions$: Observable<
    { label: string; surveys: Survey[] }[]
  >;

  get selectedSurvey() {
    return this.form.get('selectedSurvey').value;
  }

  surveys$ = this.ngrxStore.select(SURVEYS_NOT_IN_MODEL);

  constructor(
    private dialogRef: MatDialogRef<PickSurveyDialogComponent>,
    private dialog: MatDialog,
    private l2p: Las2peerService,
    private ngrxStore: Store,
    private fb: UntypedFormBuilder,
  ) {}

  form = this.fb.group({
    searchInput: [''],
    selectedSurvey: [null],
    addMeasures: [true],
    assignMeasures: [true],
  });

  ngOnInit() {
    this.filteredOptions$ = combineLatest([
      this.surveys$,
      this.form.get('searchInput').valueChanges.pipe(startWith('')),
    ]).pipe(
      map(([surveys, input]) => {
        const filteredSurveys = surveys.filter((survey) => {
          return survey?.name
            ?.toLowerCase()
            .includes(input?.toLowerCase());
        });

        return filteredSurveys.reduce(
          (acc, curr) => {
            if (curr.end > new Date()) {
              acc[0].surveys.push(curr);
            } else {
              acc[1].surveys.push(curr);
            }
            return acc;
          },
          [
            { label: 'Current Surveys', surveys: [] },
            { label: 'Past Surveys', surveys: [] },
          ],
        );
      }),
    );
  }

  async setSelectedSurvey(event: MatAutocompleteSelectedEvent) {
    const surveys = await firstValueFrom(this.surveys$.pipe(take(1)));
    const selectedSurvey = surveys.find(
      (survey) => survey.name === event.option.value,
    );
    if (selectedSurvey) {
      this.ngrxStore.dispatch(
        fetchResponsesForSurveyFromLimeSurvey({
          sid: (selectedSurvey as ISurvey).id as string,
          cred: (selectedSurvey as unknown as LimeSurvey).credentials,
        }),
      );
      this.form.get('selectedSurvey').setValue(selectedSurvey);
      this.form.get('searchInput').setValue('');
      this.inputRef.nativeElement.value = ''; // needed to reset the input (https://github.com/angular/components/issues/10968#issuecomment-545963282)
      this.form.get('searchInput').disable();
    }
  }

  remove(event: MatChipEvent) {
    this.form.get('selectedSurvey').setValue(null);
    this.form.get('searchInput').enable();
  }

  onAddMeasuresChange(addMeasures: boolean): void {
    if (!addMeasures) {
      this.form.get('assignMeasures').setValue(false);
    }
  }
  closeDialog() {
    this.dialogRef.close({
      selectedSurvey: this.form.get('selectedSurvey').value,
      addMeasures: this.addMeasures,
      assignMeasures: this.assignMeasures,
    });
  }
  async openAddSurveyDialog() {
    const availableQuestionnaires: Questionnaire[] =
      await firstValueFrom(
        this.ngrxStore.select(QUESTIONNAIRES).pipe(take(1)),
      );
    const dialogRef = this.dialog.open(
      PickQuestionnaireDialogComponent,
      {
        minWidth: 300,
        width: '80%',
        data: availableQuestionnaires,
      },
    );
    const {
      selectedQuestionnaire,
      addMeasures,
      assignMeasures,
      start,
      end,
    }: PickQuestionnaireResult = await firstValueFrom(
      dialogRef.afterClosed(),
    );
    const surveyStart = start ? start.toISOString() : nowAsIsoDate();
    const surveyEnd = end ? end.toISOString() : in100YearsAsIsoDate();
    if (selectedQuestionnaire) {
      const survey = await this.createNewSurvey(
        selectedQuestionnaire,
        surveyStart,
        surveyEnd,
      );

      this.dialogRef.close({
        selectedSurvey: survey,
        addMeasures,
        assignMeasures,
      });
    }
  }

  private async createNewSurvey(
    questionnaire: Questionnaire,
    start: string,
    end: string,
  ): Promise<Survey> {
    const [service, group, user] = await Promise.all([
      firstValueFrom(
        this.ngrxStore.select(SELECTED_SERVICE).pipe(take(1)),
      ),
      firstValueFrom(
        this.ngrxStore.select(SELECTED_GROUP).pipe(take(1)),
      ),
      firstValueFrom(this.ngrxStore.select(USER).pipe(take(1))),
    ]);
    let serviceName = service.name;
    if (serviceName.includes('@')) {
      serviceName = serviceName.split('@')[0];
    }
    const surveyName = `${service.alias}: ${questionnaire.name}`;

    try {
      const response = await this.l2p.createSurvey(
        surveyName,
        questionnaire.description,
        group.name,
        questionnaire.logo,
        start,
        end,
        serviceName,
        service.alias,
        questionnaire.lang,
      );
      if (!response || !('id' in response)) {
        throw new Error('Invalid survey id: undefined');
      }

      const surveyId = parseInt((response as { id: string }).id, 10);

      await this.l2p.setQuestionnaireForSurvey(
        questionnaire.id,
        surveyId,
      );

      return new Survey({
        name: surveyName,
        id: surveyId,
        description: questionnaire.description,
        qid: questionnaire.id,
        logo: questionnaire.logo,
        lang: questionnaire.lang,
        start,
        end,
        organization: group.name,
        resource: serviceName,
        owner: user.profile.preferred_username,
        url: joinAbsoluteUrlPath(
          this.mobsosSurveysUrl,
          'surveys',
          surveyId,
        ),
        'resource-label': service.alias,
      });
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  isMobSOSSurvey(selectedSurvey: ISurvey) {
    return !!selectedSurvey && 'resource-label' in selectedSurvey;
  }
}

function nowAsIsoDate(): string {
  return new Date().toISOString();
}

function in100YearsAsIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();
  return new Date(year + 100, month, day).toISOString();
}
