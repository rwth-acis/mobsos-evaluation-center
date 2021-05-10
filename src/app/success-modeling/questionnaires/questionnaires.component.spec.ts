import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import {QuestionnairesComponent} from './questionnaires.component';
import {MatIconModule} from '@angular/material/icon';
import {MatCardModule} from '@angular/material/card';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatButtonModule} from '@angular/material/button';
import {TranslateLoader, TranslateModule} from '@ngx-translate/core';
import {createTranslateLoader} from '../../app.module';
import {MatDialogModule} from '@angular/material/dialog';
import {LoggerModule, NgxLoggerLevel} from 'ngx-logger';
import {SuccessModel} from '../../../success-model/success-model';

describe('QuestionnairesComponent', () => {
  let component: QuestionnairesComponent;
  let fixture: ComponentFixture<QuestionnairesComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [QuestionnairesComponent],
      imports: [
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useFactory: (createTranslateLoader)
          },
        }),
        LoggerModule.forRoot({
          level: NgxLoggerLevel.TRACE,
          serverLogLevel: NgxLoggerLevel.OFF
        }),
        MatIconModule,
        MatCardModule,
        MatTooltipModule,
        MatButtonModule,
        MatDialogModule,
      ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(QuestionnairesComponent);
    component = fixture.componentInstance;
    component.availableQuestionnaires = [];
    component.editMode = false;
    component.groupID = 'testGroupID';
    component.measures = {};
    component.model = new SuccessModel('TestModel', 'TestService', {
      'System Quality': [],
      'Information Quality': [],
      Use: [],
      'User Satisfaction': [],
      'Individual Impact': [],
      'Community Impact': [],
    }, [], null);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
