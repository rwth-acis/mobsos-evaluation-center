import {
  ComponentFixture,
  TestBed,
  waitForAsync,
} from '@angular/core/testing';
import { SuccessModelingComponent } from './success-modeling.component';
import {
  TranslateLoader,
  TranslateModule,
} from '@ngx-translate/core';
import { createTranslateLoader } from 'src/app/app.module';
import { SuccessDimensionComponent } from 'src/app/components/success-modeling/success-model/success-dimension/success-dimension.component';
import { SuccessFactorComponent } from 'src/app/components/success-modeling/success-model/success-dimension/success-factor/success-factor.component';
import { SuccessMeasureComponent } from 'src/app/components/success-modeling/success-model/success-dimension/success-factor/success-measure/success-measure.component';
import { LoggerModule, NgxLoggerLevel } from 'ngx-logger';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { SurveyComponent } from 'src/app/components/success-modeling/success-model/surveys/surveys.component';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatLegacySlideToggleModule as MatSlideToggleModule } from '@angular/material/legacy-slide-toggle';
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyTooltipModule as MatTooltipModule } from '@angular/material/legacy-tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog';
import { MatLegacySnackBarModule as MatSnackBarModule } from '@angular/material/legacy-snack-bar';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import {
  AppState,
  INITIAL_APP_STATE,
} from 'src/app/models/state.model';
import { StateEffects } from 'src/app/services/store/store.effects';
import { Observable } from 'rxjs';
import { provideMockActions } from '@ngrx/effects/testing';
import { MatLegacyProgressSpinnerModule as MatProgressSpinnerModule } from '@angular/material/legacy-progress-spinner';

describe('SuccessModelingComponent', () => {
  let component: SuccessModelingComponent;
  let fixture: ComponentFixture<SuccessModelingComponent>;
  const initialState = INITIAL_APP_STATE;
  // eslint-disable-next-line prefer-const
  let actions$: Observable<any>;
  let store: MockStore<AppState>;
  beforeEach(waitForAsync(() => {
    void TestBed.configureTestingModule({
      declarations: [
        SuccessModelingComponent,
        SuccessDimensionComponent,
        SuccessFactorComponent,
        SuccessMeasureComponent,
        SurveyComponent,
      ],
      imports: [
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useFactory: createTranslateLoader,
          },
        }),
        MatSelectModule,
        MatToolbarModule,
        MatSlideToggleModule,
        MatCardModule,
        MatIconModule,
        LoggerModule.forRoot({
          level: NgxLoggerLevel.TRACE,
          serverLogLevel: NgxLoggerLevel.OFF,
        }),
        BrowserAnimationsModule,
        HttpClientTestingModule,
        MatSlideToggleModule,
        MatTooltipModule,
        MatProgressSpinnerModule,
        MatBadgeModule,
        MatButtonToggleModule,
        MatDialogModule,
        MatSnackBarModule,
        MatExpansionModule,
      ],
      providers: [
        provideMockStore({ initialState }),
        provideMockActions(() => actions$),
        StateEffects,
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    store = TestBed.inject(MockStore);
    fixture = TestBed.createComponent(SuccessModelingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    void expect(component).toBeTruthy();
  });
});
