import { BrowserModule } from '@angular/platform-browser';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { ActionReducer, MetaReducer, StoreModule } from '@ngrx/store';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRippleModule } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { OidcSigninComponent } from './oidc-signin/oidc-signin.component';
import { OidcSignoutComponent } from './oidc-signout/oidc-signout.component';
import { OidcSilentComponent } from './oidc-silent/oidc-silent.component';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { DashboardComponent } from './dashboard/dashboard.component';
import { SuccessModelingComponent } from './success-modeling/success-modeling.component';
import { RawEditComponent } from './raw-edit/raw-edit.component';
import { LoggerModule, NgxLoggerLevel } from 'ngx-logger';
import { Observable, of } from 'rxjs';
import {
  TranslateLoader,
  TranslateModule,
} from '@ngx-translate/core';
import { translations as en } from '../locale/en';
import { translations as de } from '../locale/de';
import {
  MonacoEditorModule,
  NGX_MONACO_EDITOR_CONFIG,
  NgxMonacoEditorConfig,
} from 'ngx-monaco-editor';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SuccessDimensionComponent } from './success-dimension/success-dimension.component';
import { Location, PlatformLocation } from '@angular/common';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';

import { SuccessMeasureComponent } from './success-measure/success-measure.component';
import { SuccessFactorComponent } from './success-factor/success-factor.component';
import { ErrorDialogComponent } from './error-dialog/error-dialog.component';
import { ValueVisualizationComponent } from './visualizations/value-visualization/value-visualization.component';

import { ChartVisualizerComponent } from './visualizations/chart-visualization/chart-visualization.component';
import { KpiVisualizationComponent } from './visualizations/kpi-visualization/kpi-visualization.component';
import { BaseVisualizationComponent } from './visualizations/visualization.component';
import { ConfirmationDialogComponent } from './confirmation-dialog/confirmation-dialog.component';

import { EditFactorDialogComponent } from './success-dimension/edit-factor-dialog/edit-factor-dialog.component';
import { PickMeasureDialogComponent } from './success-factor/pick-measure-dialog/pick-measure-dialog.component';
import { EditMeasureDialogComponent } from './success-factor/edit-measure-dialog/edit-measure-dialog.component';
import { QuestionnairesComponent } from './success-modeling/questionnaires/questionnaires.component';
// tslint:disable-next-line:max-line-length
import { PickQuestionnaireDialogComponent } from './success-modeling/questionnaires/pick-questionnaire-dialog/pick-questionnaire-dialog.component';
// tslint:disable-next-line:max-line-length
import { DeleteQuestionnaireDialogComponent } from './success-modeling/questionnaires/delete-questionnaire-dialog/delete-questionnaire-dialog.component';
import { MarkdownModule } from 'ngx-markdown';
import { SqlTableComponent } from './success-factor/edit-measure-dialog/sql-table/sql-table.component';
import { RequirementsListComponent } from './success-modeling/requirements-list/requirements-list.component';
// tslint:disable-next-line:max-line-length
import { PickReqbazProjectComponent } from './success-modeling/requirements-list/pick-reqbaz-project/pick-reqbaz-project.component';
import {
  HttpClientModule,
  HTTP_INTERCEPTORS,
} from '@angular/common/http';
import { GoogleChartsModule } from 'angular-google-charts';

import { Reducer } from 'src/app/services/store.reducer';
import { EffectsModule } from '@ngrx/effects';
import { StateEffects } from './services/store.effects';
import { Interceptor } from './services/interceptor.service';
import { localStorageSync } from 'ngrx-store-localstorage';
import { WorkspaceManagementComponent } from './workspace-management/workspace-management.component';
import { JoinWorkSpaceComponent } from './join-work-space/join-work-space.component';
import { VisitorComponent } from './visitor/visitor.component';
import { PickUsernameDialogComponent } from './pick-username-dialog/pick-username-dialog.component';
import { BottomSheetComponent } from './bottom-sheet/bottom-sheet.component';
import { AddCommunityDialogComponent } from './add-community-dialog/add-community-dialog.component';
import { VisualizationInfoComponent } from './visualizations/visualization-info/visualization-info.component';

class ImportLoader implements TranslateLoader {
  getTranslation(lang: string): Observable<any> {
    if (lang === 'en') {
      return of(en);
    } else if (lang === 'de') {
      return of(de);
    }
  }
}

export function createTranslateLoader() {
  return new ImportLoader();
}

export function localStorageSyncReducer(
  reducer: ActionReducer<any>,
): ActionReducer<any> {
  return localStorageSync({
    keys: [
      {
        Reducer: [
          'services',
          'groups',
          'selectedGroupId',
          'selectedServiceName',
          'questionnaires',
          'expertMode',
          'measureCatalog',
          'user',
          'successModel',
          'editMode',
          'visualizationData',
          'currentWorkSpaceOwner',
        ],
      },
    ],
    rehydrate: true,
    removeOnUndefined: true,
  })(reducer);
}
const metaReducers: Array<MetaReducer<any, any>> = [
  localStorageSyncReducer,
];

@NgModule({
  declarations: [
    AppComponent,
    OidcSigninComponent,
    OidcSignoutComponent,
    OidcSilentComponent,
    DashboardComponent,
    SuccessModelingComponent,
    RawEditComponent,
    SuccessDimensionComponent,
    SuccessMeasureComponent,
    SuccessFactorComponent,
    ErrorDialogComponent,
    BaseVisualizationComponent,
    ValueVisualizationComponent,
    ChartVisualizerComponent,
    KpiVisualizationComponent,
    ConfirmationDialogComponent,
    EditFactorDialogComponent,
    EditMeasureDialogComponent,
    PickMeasureDialogComponent,
    EditMeasureDialogComponent,
    QuestionnairesComponent,
    PickQuestionnaireDialogComponent,
    DeleteQuestionnaireDialogComponent,
    SqlTableComponent,
    RequirementsListComponent,
    PickReqbazProjectComponent,
    WorkspaceManagementComponent,
    JoinWorkSpaceComponent,
    VisitorComponent,
    PickUsernameDialogComponent,
    BottomSheetComponent,
    AddCommunityDialogComponent,
    VisualizationInfoComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    MatMenuModule,
    MatExpansionModule,
    GoogleChartsModule,
    BrowserAnimationsModule,
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
    MarkdownModule.forRoot(),
    StoreModule.forRoot({ Reducer }, { metaReducers }),
    EffectsModule.forRoot([StateEffects]),
    MatSidenavModule,
    MatIconModule,
    MatListModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatBottomSheetModule,
    MatTabsModule,
    MatFormFieldModule,
    MatProgressBarModule,
    MatSelectModule,
    MatSnackBarModule,
    MonacoEditorModule.forRoot(),
    FormsModule,
    MatToolbarModule,
    MatCardModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.production,
    }),
    MatDialogModule,
    MatProgressSpinnerModule,
    MatButtonToggleModule,
    MatBadgeModule,
    MatTooltipModule,
    MatInputModule,
    MatRippleModule,
    MatCheckboxModule,
    MatExpansionModule,
    MatAutocompleteModule,
    ReactiveFormsModule,
  ],
  providers: [
    {
      provide: NGX_MONACO_EDITOR_CONFIG,
      useFactory: getMonacoConfig,
      deps: [PlatformLocation],
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: Interceptor,
      multi: true,
    },
  ],
  bootstrap: [AppComponent],

  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppModule {}

export function getMonacoConfig(
  platformLocation: PlatformLocation,
): NgxMonacoEditorConfig {
  const baseHref = platformLocation.getBaseHrefFromDOM();

  return {
    baseUrl: Location.joinWithSlash(baseHref, '/assets'),
  };
}
