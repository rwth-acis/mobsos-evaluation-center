import { NgModule } from '@angular/core';
import { CommonModule, PlatformLocation } from '@angular/common';
import { RawEditComponent } from './raw-edit.component';
import { SharedModule } from '../../shared/shared.module';
import { MonacoEditorModule } from '@materia-ui/ngx-monaco-editor';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
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
