import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SurveyComponent } from './surveys.component';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card';
import { MatLegacyTooltipModule as MatTooltipModule } from '@angular/material/legacy-tooltip';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import {
  TranslateLoader,
  TranslateModule,
} from '@ngx-translate/core';
import { createTranslateLoader } from 'src/app/app.module';
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog';
import { LoggerModule, NgxLoggerLevel } from 'ngx-logger';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { INITIAL_APP_STATE } from 'src/app/models/state.model';

import { SuccessModel } from 'src/app/models/success.model';
import { of } from 'rxjs';
import { Survey } from 'src/app/models/survey.model';

import { MatLegacySnackBarModule as MatSnackBarModule } from '@angular/material/legacy-snack-bar';
import { StateEffects } from 'src/app/services/store/store.effects';
import { Actions } from '@ngrx/effects';
import { provideMockActions } from '@ngrx/effects/testing';

describe('SruveysComponent', () => {
  let component: SurveyComponent;
  let fixture: ComponentFixture<SurveyComponent>;
  let testSurvey = new Survey({
    description: 'Test Survey',
    start: new Date().toISOString(),
    end: new Date(Date.now() + 2000000).toISOString(),
    id: 0,
    name: `Test (${new Date().toISOString()})`,
    organization: 'Test Organization',
    owner: 'Test Owner',
    resource: 'Test Resource',
    'resource-label': 'Test Resource Label',
  });
  let actions: Actions;
  const initialState = INITIAL_APP_STATE;
  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SurveyComponent],
      imports: [
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useFactory: createTranslateLoader,
          },
        }),
        MatDialogModule,
        LoggerModule.forRoot({
          level: NgxLoggerLevel.TRACE,
          serverLogLevel: NgxLoggerLevel.OFF,
        }),
        MatIconModule,
        MatSnackBarModule,
        MatCardModule,
        MatTooltipModule,
        MatButtonModule,
        MatDialogModule,
        HttpClientTestingModule,
      ],
      providers: [
        provideMockStore({ initialState }),
        {
          provide: StateEffects,
          useValue: { fetchQuestionnaireForm$: of(null) },
        },
        provideMockActions(() => actions),
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SurveyComponent);
    component = fixture.componentInstance;
    actions = TestBed.inject(Actions);
    // component.availableQuestionnaires = [];
    // component.editMode = false;
    // component.groupID = 'testGroupID';
    // component.measures = {};
    // component.model = new SuccessModel(
    //   'TestModel',
    //   'TestService',
    //   {
    //     'System Quality': [],
    //     'Information Quality': [],
    //     Use: [],
    //     'User Satisfaction': [],
    //     'Individual Impact': [],
    //     'Community Impact': [],
    //   },
    //   [],
    //   null,
    // );
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
