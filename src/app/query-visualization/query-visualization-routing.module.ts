import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { QueryVisualizationComponent } from './query-visualization/query-visualization.component';

const routes: Routes = [
  { path: '', component: QueryVisualizationComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class QueryVisualizationRoutingModule {}
