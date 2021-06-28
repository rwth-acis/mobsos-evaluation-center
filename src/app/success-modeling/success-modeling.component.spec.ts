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
import { createTranslateLoader } from '../app.module';
import { SuccessDimensionComponent } from '../success-dimension/success-dimension.component';
import { SuccessFactorComponent } from '../success-factor/success-factor.component';
import { SuccessMeasureComponent } from '../success-measure/success-measure.component';
import { LoggerModule, NgxLoggerLevel } from 'ngx-logger';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RequirementsListComponent } from './requirements-list/requirements-list.component';
import { QuestionnairesComponent } from './questionnaires/questionnaires.component';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { AppState, INITIAL_APP_STATE } from '../models/state.model';
import { StateEffects } from '../services/store.effects';
import { Observable } from 'rxjs';
import { provideMockActions } from '@ngrx/effects/testing';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

describe('SuccessModelingComponent', () => {
  let component: SuccessModelingComponent;
  let fixture: ComponentFixture<SuccessModelingComponent>;
  const initialState = INITIAL_APP_STATE;
  // tslint:disable-next-line: prefer-const
  let actions$: Observable<any>;
  let store: MockStore<AppState>;
  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [
          SuccessModelingComponent,
          SuccessDimensionComponent,
          SuccessFactorComponent,
          SuccessMeasureComponent,
          RequirementsListComponent,
          QuestionnairesComponent,
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
    }),
  );

  beforeEach(() => {
    store = TestBed.inject(MockStore);
    fixture = TestBed.createComponent(SuccessModelingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
