import { NgModule } from '@angular/core';
import { CommonModule, PlatformLocation } from '@angular/common';
import { RawEditComponent } from './raw-edit.component';
import { SharedModule } from '../shared/shared.module';
import {
  MonacoEditorModule,
  NGX_MONACO_EDITOR_CONFIG,
} from 'ngx-monaco-editor';
import { getMonacoConfig } from '../app.module';

@NgModule({
  declarations: [RawEditComponent],
  imports: [CommonModule, SharedModule, MonacoEditorModule],
  providers: [
    {
      provide: NGX_MONACO_EDITOR_CONFIG,
      useFactory: getMonacoConfig,
      deps: [PlatformLocation],
    },
  ],
})
export class RawEditModule {}
