import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { JoinWorkSpaceComponent } from './components/join-work-space/join-work-space.component';
import { CustomPreloadingStrategy } from './preloading-strategy';
import { AuthService as AuthGuard } from './services/auth.service';
import { NotFoundComponent } from './components/not-found/not-found.component';

const routes: Routes = [
  { path: '', redirectTo: 'success-modeling', pathMatch: 'full' },
  {
    path: 'welcome',
    loadChildren: () =>
      import('./components/welcome/welcome.module').then(
        (m) => m.WelcomeModule,
      ),
  },
  {
    path: 'success-modeling',
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        redirectTo: 'workspace',
        pathMatch: 'full',
      },
      {
        path: 'workspace',
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
  {
    path: '**',
    component: NotFoundComponent,
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
