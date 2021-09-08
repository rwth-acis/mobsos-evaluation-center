import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OidcSigninComponent } from './oidc/oidc-signin/oidc-signin.component';
import { OidcSignoutComponent } from './oidc/oidc-signout/oidc-signout.component';
import { OidcSilentComponent } from './oidc/oidc-silent/oidc-silent.component';
import { JoinWorkSpaceComponent } from './join-work-space/join-work-space.component';

import { WorkspaceComponent } from './success-modeling/workspace/workspace.component';
import { VisitorComponent } from './success-modeling/visitor/visitor.component';

const routes: Routes = [
  { path: '', component: WorkspaceComponent },
  {
    path: 'raw-edit',
    loadChildren: () =>
      import('./raw-edit/raw-edit.module').then(
        (m) => m.RawEditModule,
      ),
  },
  { path: 'oidc-signin', component: OidcSigninComponent },
  { path: 'oidc-signout', component: OidcSignoutComponent },
  { path: 'oidc-silent', component: OidcSilentComponent },
  {
    path: 'join/:groupId/:serviceName/:username',
    component: JoinWorkSpaceComponent,
  },
  { path: 'visitor', component: VisitorComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
