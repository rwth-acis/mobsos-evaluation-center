import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SurveyComponent } from './surveys.component';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import {
  TranslateLoader,
  TranslateModule,
} from '@ngx-translate/core';
import { createTranslateLoader } from 'src/app/app.module';
import { MatDialogModule } from '@angular/material/dialog';
import { LoggerModule, NgxLoggerLevel } from 'ngx-logger';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { INITIAL_APP_STATE } from 'src/app/models/state.model';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { StateEffects } from 'src/app/services/store/store.effects';
import { Actions } from '@ngrx/effects';
import { provideMockActions } from '@ngrx/effects/testing';
import { of } from 'rxjs';

describe('SruveysComponent', () => {
  let component: SurveyComponent;
  let fixture: ComponentFixture<SurveyComponent>;
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
