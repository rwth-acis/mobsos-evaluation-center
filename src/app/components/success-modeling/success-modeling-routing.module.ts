import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SuccessModelingComponent } from './success-modeling.component';
import { VisitorComponent } from './visitor/visitor.component';
import { AuthService as AuthGuard } from '../../services/auth.service';

const routes: Routes = [
  {
    path: '',
    canActivate: [AuthGuard],
    component: SuccessModelingComponent,
  },
  { path: 'guest', component: VisitorComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SuccessModelingRoutingModule {}
