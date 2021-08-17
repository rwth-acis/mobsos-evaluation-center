import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SuccessModelingComponent } from './success-modeling/success-modeling.component';
import { RawEditComponent } from './raw-edit/raw-edit.component';
import { OidcSigninComponent } from './oidc-signin/oidc-signin.component';
import { OidcSignoutComponent } from './oidc-signout/oidc-signout.component';
import { OidcSilentComponent } from './oidc-silent/oidc-silent.component';
import { JoinWorkSpaceComponent } from './join-work-space/join-work-space.component';
import { VisitorComponent } from './visitor/visitor.component';
import { WorkspaceComponent } from './workspace/workspace.component';
import { OathComponent } from './oath/oath.component';

const routes: Routes = [
  { path: '', component: WorkspaceComponent },
  { path: 'requirements', component: WorkspaceComponent },
  { path: 'modeling', component: WorkspaceComponent },
  { path: 'raw-edit', component: RawEditComponent },
  { path: 'oidc-signin', component: OidcSigninComponent },
  { path: 'oidc-signout', component: OidcSignoutComponent },
  { path: 'oidc-silent', component: OidcSilentComponent },
  { path: 'oauth', component: OathComponent },
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
