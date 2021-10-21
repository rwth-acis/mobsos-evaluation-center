import { BrowserModule } from '@angular/platform-browser';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { ActionReducer, MetaReducer, StoreModule } from '@ngrx/store';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { OidcSigninComponent } from './oidc/oidc-signin/oidc-signin.component';
import { OidcSignoutComponent } from './oidc/oidc-signout/oidc-signout.component';
import { OidcSilentComponent } from './oidc/oidc-silent/oidc-silent.component';
import { Observable, of } from 'rxjs';
import {
  TranslateLoader,
  TranslateModule,
} from '@ngx-translate/core';
import { translations as en } from '../locale/en';
import { translations as de } from '../locale/de';
import {
  MonacoEditorModule,
  NgxMonacoEditorConfig,
} from 'ngx-monaco-editor';

import { FormsModule } from '@angular/forms';
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

import { Reducer } from 'src/app/services/store.reducer';
import { EffectsModule } from '@ngrx/effects';
import { StateEffects } from './services/store.effects';
import { Interceptor } from './services/interceptor.service';
import { localStorageSync } from 'ngrx-store-localstorage';

import { AddCommunityDialogComponent } from './add-community-dialog/add-community-dialog.component';
import { SharedModule } from './shared/shared.module';
import { RawEditModule } from './raw-edit/raw-edit.module';
import { SuccessModelingModule } from './success-modeling/success-modeling.module';
import { JoinWorkSpaceComponent } from './join-work-space/join-work-space.component';
import { HttpLink } from 'apollo-angular/http';
import { APOLLO_OPTIONS } from 'apollo-angular';
import { InMemoryCache } from '@apollo/client/core';
class ImportLoader implements TranslateLoader {
  getTranslation(lang: string): Observable<any> {
    if (lang === 'en') {
      return of(en);
    } else if (lang === 'de') {
      return of(de);
    }
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
    AddCommunityDialogComponent,
    JoinWorkSpaceComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    RawEditModule,
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
    MonacoEditorModule.forRoot(),
    MarkdownModule.forRoot(),
    StoreModule.forRoot({ Reducer }, { metaReducers }),
    EffectsModule.forRoot([StateEffects]),
    MatSidenavModule,
    MatListModule,
    MatProgressBarModule,
    FormsModule,

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
    {
      provide: APOLLO_OPTIONS,
      useFactory: (httpLink: HttpLink) => {
        return {
          cache: new InMemoryCache(),
          link: httpLink.create({
            uri: 'https://api.github.com/graphql',
          }),
        };
      },
      deps: [HttpLink],
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
