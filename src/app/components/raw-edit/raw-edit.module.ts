import { NgModule } from '@angular/core';
import { CommonModule, PlatformLocation } from '@angular/common';
import { RawEditComponent } from './raw-edit.component';
import { SharedModule } from '../../shared/shared.module';
import {
  MonacoEditorModule,
  NgxMonacoEditorConfig,
  NGX_MONACO_EDITOR_CONFIG,
} from 'ngx-monaco-editor';
import { Location } from '@angular/common';
import { RawEditRoutingModule } from './raw-edit-routing.module';
@NgModule({
  declarations: [RawEditComponent],
  imports: [
    CommonModule,
    SharedModule,
    MonacoEditorModule,
    RawEditRoutingModule,
  ],
  providers: [
    {
      provide: NGX_MONACO_EDITOR_CONFIG,
      useFactory: getMonacoConfig,
      deps: [PlatformLocation],
    },
  ],
})
export class RawEditModule {}

function getMonacoConfig(
  platformLocation: PlatformLocation,
): NgxMonacoEditorConfig {
  const baseHref = platformLocation.getBaseHrefFromDOM();

  return {
    baseUrl: Location.joinWithSlash(baseHref, '/assets'),
  };
}
