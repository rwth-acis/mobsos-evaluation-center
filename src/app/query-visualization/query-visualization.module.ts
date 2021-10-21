import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { QueryVisualizationRoutingModule } from './query-visualization-routing.module';
import { QueryVisualizationComponent } from './query-visualization/query-visualization.component';
import { SharedModule } from '../shared/shared.module';
import { SqlTableComponent } from '../shared/sql-table/sql-table.component';

@NgModule({
  declarations: [QueryVisualizationComponent],
  imports: [
    CommonModule,
    SharedModule,
    QueryVisualizationRoutingModule,
  ],
})
export class QueryVisualizationModule {}
