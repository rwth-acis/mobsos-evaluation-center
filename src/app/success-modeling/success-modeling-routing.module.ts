import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SuccessModelingComponent } from './success-modeling.component';
import { VisitorComponent } from './visitor/visitor.component';

const routes: Routes = [
  {
    path: '',
    component: SuccessModelingComponent,
  },
  { path: 'visitor', component: VisitorComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SuccessModelingRoutingModule {}
