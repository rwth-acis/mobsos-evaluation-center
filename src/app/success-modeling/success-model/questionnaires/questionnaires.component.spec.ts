import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuestionnairesComponent } from './questionnaires.component';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import {
  TranslateLoader,
  TranslateModule,
} from '@ngx-translate/core';
import { createTranslateLoader } from '../../app.module';
import { MatDialogModule } from '@angular/material/dialog';
import { LoggerModule, NgxLoggerLevel } from 'ngx-logger';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { INITIAL_APP_STATE } from 'src/app/models/state.model';
import { SuccessModel } from 'src/app/models/success.model';

describe('QuestionnairesComponent', () => {
  let component: QuestionnairesComponent;
  let fixture: ComponentFixture<QuestionnairesComponent>;
  const initialState = INITIAL_APP_STATE;
  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [QuestionnairesComponent],
      imports: [
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useFactory: createTranslateLoader,
          },
        }),
        LoggerModule.forRoot({
          level: NgxLoggerLevel.TRACE,
          serverLogLevel: NgxLoggerLevel.OFF,
        }),
        MatIconModule,
        MatCardModule,
        MatTooltipModule,
        MatButtonModule,
        MatDialogModule,
        HttpClientTestingModule,
      ],
      providers: [provideMockStore({ initialState })],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(QuestionnairesComponent);
    component = fixture.componentInstance;
    component.availableQuestionnaires = [];
    component.editMode = false;
    component.groupID = 'testGroupID';
    component.measures = {};
    component.model = new SuccessModel(
      'TestModel',
      'TestService',
      {
        'System Quality': [],
        'Information Quality': [],
        Use: [],
        'User Satisfaction': [],
        'Individual Impact': [],
        'Community Impact': [],
      },
      [],
      null,
    );
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
