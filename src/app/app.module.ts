import {BrowserModule} from '@angular/platform-browser';
import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {
  MatButtonModule,
  MatCardModule,
  MatFormFieldModule,
  MatIconModule,
  MatListModule,
  MatSelectModule,
  MatSidenavModule,
  MatSlideToggleModule,
  MatSnackBarModule,
  MatTabsModule,
  MatToolbarModule
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
import {PlatformLocation, Location} from "@angular/common";
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';


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
    SuccessDimensionComponent
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
    ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production })
  ],
  providers: [
    {
      provide: NGX_MONACO_EDITOR_CONFIG,
      useFactory: getMonacoConfig,
      deps: [PlatformLocation]
    }
  ],
  bootstrap: [AppComponent],
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
  }
}
