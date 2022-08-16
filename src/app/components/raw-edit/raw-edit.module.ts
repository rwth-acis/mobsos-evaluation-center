import { NgModule } from '@angular/core';
import { CommonModule, PlatformLocation } from '@angular/common';
import { RawEditComponent } from './raw-edit.component';
import { SharedModule } from '../../shared/shared.module';
import { MonacoEditorModule } from '@materia-ui/ngx-monaco-editor';
import { MatButtonModule } from '@angular/material/button';
import { RawEditRoutingModule } from './raw-edit-routing.module';
@NgModule({
  declarations: [RawEditComponent],
  imports: [
    CommonModule,
    SharedModule,
    MonacoEditorModule,
    RawEditRoutingModule,
    MatButtonModule,
  ],
  providers: [],
})
export class RawEditModule {}
