import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OidcSigninComponent } from './components/oidc/oidc-signin/oidc-signin.component';
import { OidcSignoutComponent } from './components/oidc/oidc-signout/oidc-signout.component';
import { OidcSilentComponent } from './components/oidc/oidc-silent/oidc-silent.component';
import { JoinWorkSpaceComponent } from './components/join-work-space/join-work-space.component';
import { CustomPreloadingStrategy } from './preloading-strategy';
import { AuthService as AuthGuard } from './services/auth.service';

const routes: Routes = [
  { path: '', redirectTo: '/success-modeling', pathMatch: 'full' },
  {
    path: 'welcome',
    loadChildren: () =>
      import('./components/welcome/welcome.module').then(
        (m) => m.WelcomeModule,
      ),
  },
  {
    path: 'success-modeling',
    children: [
      {
        path: '',
        loadChildren: () =>
          import(
            './components/success-modeling/success-modeling.module'
          ).then((m) => m.SuccessModelingModule),
        data: { preload: true },
      },
      {
        path: 'raw-edit',
        loadChildren: () =>
          import('./components/raw-edit/raw-edit.module').then(
            (m) => m.RawEditModule,
          ),
      },
    ],
  },
  { path: 'oidc-signin', component: OidcSigninComponent },
  { path: 'oidc-signout', component: OidcSignoutComponent },
  { path: 'oidc-silent', component: OidcSilentComponent },
  {
    path: 'join/:groupId/:serviceName/:username',
    component: JoinWorkSpaceComponent,
  },
  {
    path: 'query-visualization',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import(
        './components/query-visualization/query-visualization.module'
      ).then((m) => m.QueryVisualizationModule),
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      preloadingStrategy: CustomPreloadingStrategy,
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
