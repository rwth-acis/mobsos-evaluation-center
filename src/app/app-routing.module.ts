import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {DashboardComponent} from './dashboard/dashboard.component';
import {SuccessModelingComponent} from './success-modeling/success-modeling.component';
import {RawEditComponent} from './raw-edit/raw-edit.component';
import {OidcSigninComponent} from './oidc-signin/oidc-signin.component';
import {OidcSignoutComponent} from './oidc-signout/oidc-signout.component';
import {OidcSilentComponent} from './oidc-silent/oidc-silent.component';

const routes: Routes = [
  {path: '', component: SuccessModelingComponent},
  {path: 'raw-edit', component: RawEditComponent},
  {path: 'oidc-signin', component: OidcSigninComponent},
  {path: 'oidc-signout', component: OidcSignoutComponent},
  {path: 'oidc-silent', component: OidcSilentComponent},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
