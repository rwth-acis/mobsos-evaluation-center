import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {SuccessModelingComponent} from './success-modeling.component';
import {TranslateLoader, TranslateModule} from '@ngx-translate/core';
import {createTranslateLoader} from '../app.module';
import {
  MatBadgeModule,
  MatButtonToggleModule,
  MatCardModule,
  MatDialogModule,
  MatIconModule,
  MatSelectModule,
  MatSlideToggleModule,
  MatSnackBarModule,
  MatToolbarModule,
  MatTooltipModule
} from '@angular/material';
import {SuccessDimensionComponent} from '../success-dimension/success-dimension.component';
import {SuccessFactorComponent} from '../success-factor/success-factor.component';
import {SuccessMeasureComponent} from '../success-measure/success-measure.component';
import {LoggerModule, NgxLoggerLevel} from 'ngx-logger';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {HttpClientTestingModule} from '@angular/common/http/testing';

import {RequirementsListComponent} from './requirements-list/requirements-list.component';
import {QuestionnairesComponent} from './questionnaires/questionnaires.component';
import {MatExpansionModule, MatExpansionPanel} from '@angular/material/expansion';

describe('SuccessModelingComponent', () => {
  let component: SuccessModelingComponent;
  let fixture: ComponentFixture<SuccessModelingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SuccessModelingComponent, SuccessDimensionComponent, SuccessFactorComponent,
        SuccessMeasureComponent, RequirementsListComponent, QuestionnairesComponent],
      imports: [
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useFactory: (createTranslateLoader)
          }
        }),
        MatSelectModule,
        MatToolbarModule,
        MatSlideToggleModule,
        MatCardModule,
        MatIconModule,
        LoggerModule.forRoot({
          level: NgxLoggerLevel.TRACE,
          serverLogLevel: NgxLoggerLevel.OFF
        }),
        BrowserAnimationsModule,
        HttpClientTestingModule,
        MatSlideToggleModule,
        MatTooltipModule,
        MatBadgeModule,
        MatButtonToggleModule,
        MatDialogModule,
        MatSnackBarModule,
        MatExpansionModule,
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SuccessModelingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
