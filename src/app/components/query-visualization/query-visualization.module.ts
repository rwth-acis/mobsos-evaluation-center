import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { QueryVisualizationRoutingModule } from './query-visualization-routing.module';
import { QueryVisualizationComponent } from './query-visualization/query-visualization.component';
import { SharedModule } from '../../shared/shared.module';
import { VisualizationsModule } from 'src/app/shared/visualizations/visualizations.module';

@NgModule({
  declarations: [QueryVisualizationComponent],
  imports: [
    CommonModule,
    SharedModule,
    QueryVisualizationRoutingModule,
    VisualizationsModule,
  ],
})
export class QueryVisualizationModule {}
