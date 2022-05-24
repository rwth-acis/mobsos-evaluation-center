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
import { createTranslateLoader } from '../../app.module';
import { MatDialogModule } from '@angular/material/dialog';
import { LoggerModule, NgxLoggerLevel } from 'ngx-logger';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { INITIAL_APP_STATE } from 'src/app/models/state.model';
import { SuccessModel } from 'src/app/models/success.model';
import { of } from 'rxjs';
import { Survey } from 'src/app/models/survey.model';

describe('QuestionnairesComponent', () => {
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
    fixture = TestBed.createComponent(SurveyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
