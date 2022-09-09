import { BrowserModule } from '@angular/platform-browser';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { ActionReducer, MetaReducer, StoreModule } from '@ngrx/store';
import { AppRoutingModule } from './app-routing.module';
import {
  AppComponent,
  AppNotificationSheetComponent,
} from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatSidenavModule } from '@angular/material/sidenav';
import { OidcSigninComponent } from './components/oidc/oidc-signin/oidc-signin.component';
import { OidcSignoutComponent } from './components/oidc/oidc-signout/oidc-signout.component';
import { OidcSilentComponent } from './components/oidc/oidc-silent/oidc-silent.component';
import { Observable, of } from 'rxjs';
import {
  TranslateLoader,
  TranslateModule,
} from '@ngx-translate/core';
import { translations as en } from '../locale/en';
import { translations as de } from '../locale/de';

import { Location, PlatformLocation } from '@angular/common';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';

// eslint-disable-next-line max-len
// eslint-disable-next-line max-len
import { MarkdownModule } from 'ngx-markdown';
// eslint-disable-next-line max-len
import {
  HttpClientModule,
  HTTP_INTERCEPTORS,
} from '@angular/common/http';
import { GoogleChartsModule } from 'angular-google-charts';

import { Reducer } from 'src/app/services/store/store.reducer';
import { EffectsModule } from '@ngrx/effects';
import { StateEffects } from './services/store/store.effects';
import { Interceptor } from './services/interceptor.service';
import { localStorageSync } from 'ngrx-store-localstorage';

import { JoinWorkSpaceComponent } from './components/join-work-space/join-work-space.component';
import { RawEditModule } from './components/raw-edit/raw-edit.module';
import { SuccessModelingModule } from './components/success-modeling/success-modeling.module';
import { SharedModule } from './shared/shared.module';
import { WelcomeModule } from './components/welcome/welcome.module';
import { NotFoundComponent } from './components/not-found/not-found.component';
import { MonacoEditorModule } from '@materia-ui/ngx-monaco-editor';
class ImportLoader implements TranslateLoader {
  getTranslation(lang: string): Observable<any> {
    if (lang === 'en') {
      return of(en);
    } else if (lang === 'de') {
      return of(de);
    }
    return null;
  }
}

export function createTranslateLoader(): ImportLoader {
  return new ImportLoader();
}

export function localStorageSyncReducer(
  reducer: ActionReducer<any>,
): ActionReducer<any> {
  return localStorageSync({
    keys: [
      {
        Reducer: [
          'groups',
          'services',
          'selectedGroupId',
          'selectedServiceName',
          'questionnaires',
          'expertMode',
          'measureCatalog',
          'user',
          'visualizationData',
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
    AppNotificationSheetComponent,
    OidcSilentComponent,
    JoinWorkSpaceComponent,
    NotFoundComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    RawEditModule,
    WelcomeModule,
    SuccessModelingModule,
    SharedModule,
    GoogleChartsModule.forRoot(),
    BrowserAnimationsModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: createTranslateLoader,
      },
    }),
    MonacoEditorModule,
    MarkdownModule.forRoot(),
    StoreModule.forRoot({ Reducer }, { metaReducers }),
    EffectsModule.forRoot([StateEffects]),
    MatSidenavModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.production,
    }),
  ],
  providers: [
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
