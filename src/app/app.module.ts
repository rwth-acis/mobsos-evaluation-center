import {BrowserModule} from '@angular/platform-browser';
import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {
  MatBadgeModule,
  MatButtonModule,
  MatButtonToggleModule,
  MatCardModule,
  MatDialogModule,
  MatFormFieldModule,
  MatIconModule,
  MatInputModule,
  MatListModule,
  MatProgressSpinnerModule,
  MatRippleModule,
  MatSelectModule,
  MatSidenavModule,
  MatSlideToggleModule,
  MatSnackBarModule,
  MatTabsModule,
  MatToolbarModule,
  MatTooltipModule
} from '@angular/material';
import {OidcSigninComponent} from './oidc-signin/oidc-signin.component';
import {OidcSignoutComponent} from './oidc-signout/oidc-signout.component';
import {OidcSilentComponent} from './oidc-silent/oidc-silent.component';
import {DashboardComponent} from './dashboard/dashboard.component';
import {SuccessModelingComponent} from './success-modeling/success-modeling.component';
import {RawEditComponent} from './raw-edit/raw-edit.component';
import {LoggerModule, NgxLoggerLevel} from 'ngx-logger';
import {Observable, of} from 'rxjs';
import {TranslateLoader, TranslateModule} from '@ngx-translate/core';
import {translations as en} from '../locale/en';
import {translations as de} from '../locale/de';
import {MonacoEditorModule, NGX_MONACO_EDITOR_CONFIG, NgxMonacoEditorConfig} from 'ngx-monaco-editor';
import {FormsModule} from '@angular/forms';
import {SuccessDimensionComponent} from './success-dimension/success-dimension.component';
import {Location, PlatformLocation} from '@angular/common';
import {ServiceWorkerModule} from '@angular/service-worker';
import {environment} from '../environments/environment';

import * as PlotlyJS from 'plotly.js/dist/plotly.js';
import {PlotlyModule} from 'angular-plotly.js';
import {SuccessMeasureComponent} from './success-measure/success-measure.component';
import {SuccessFactorComponent} from './success-factor/success-factor.component';
import {ErrorDialogComponent} from './error-dialog/error-dialog.component';
import {ValueVisualizationComponent} from './visualizations/value-visualization/value-visualization.component';
import {VisualizationDirective} from './visualization.directive';
import {ChartVisualizationComponent} from './visualizations/chart-visualization/chart-visualization.component';
import {KpiVisualizationComponent} from './visualizations/kpi-visualization/kpi-visualization.component';
import {BaseVisualizationComponent} from './visualizations/visualization.component';
import {ConfirmationDialogComponent} from './confirmation-dialog/confirmation-dialog.component';
import {MdePopoverModule} from '@material-extended/mde';
import {AddFactorDialogComponent} from './success-dimension/add-factor-dialog/add-factor-dialog.component';
import {PickMeasureDialogComponent} from './success-factor/pick-measure-dialog/pick-measure-dialog.component';
import {EditMeasureDialogComponent} from './success-factor/edit-measure-dialog/edit-measure-dialog.component';
import {AngularResizedEventModule} from "angular-resize-event";

PlotlyModule.plotlyjs = PlotlyJS;


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
    VisualizationDirective,
    ChartVisualizationComponent,
    KpiVisualizationComponent,
    ConfirmationDialogComponent,
    AddFactorDialogComponent,
    PickMeasureDialogComponent,
    EditMeasureDialogComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: (createTranslateLoader)
      }
    }),
    LoggerModule.forRoot({
      level: NgxLoggerLevel.TRACE,
      serverLogLevel: NgxLoggerLevel.OFF
    }),
    MatSidenavModule,
    MatIconModule,
    MatListModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatTabsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSnackBarModule,
    MonacoEditorModule.forRoot(),
    FormsModule,
    MatToolbarModule,
    MatCardModule,
    PlotlyModule,
    ServiceWorkerModule.register('ngsw-worker.js', {enabled: environment.production}),
    MatDialogModule,
    MatProgressSpinnerModule,
    MatButtonToggleModule,
    MatBadgeModule,
    MdePopoverModule,
    MatTooltipModule,
    MatInputModule,
    MatRippleModule,
    AngularResizedEventModule,
  ],
  providers: [
    {
      provide: NGX_MONACO_EDITOR_CONFIG,
      useFactory: getMonacoConfig,
      deps: [PlatformLocation]
    }
  ],
  bootstrap: [AppComponent],
  entryComponents: [
    ErrorDialogComponent,
    ValueVisualizationComponent,
    ChartVisualizationComponent,
    KpiVisualizationComponent,
    ConfirmationDialogComponent,
    AddFactorDialogComponent,
    PickMeasureDialogComponent,
    EditMeasureDialogComponent,
  ],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA
  ]
})
export class AppModule {
}

export function getMonacoConfig(platformLocation: PlatformLocation): NgxMonacoEditorConfig {
  const baseHref = platformLocation.getBaseHrefFromDOM();

  return {
    baseUrl: Location.joinWithSlash(baseHref, '/assets')
  };
}
