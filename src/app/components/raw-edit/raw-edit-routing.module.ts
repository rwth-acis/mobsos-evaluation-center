import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { RawEditComponent } from './raw-edit.component';

const routes: Routes = [
  {
    path: '',
    component: RawEditComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RawEditRoutingModule {}
