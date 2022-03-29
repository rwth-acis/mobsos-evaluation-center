import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InfoComponent } from './info/info.component';
import { WelcomeRoutingModule } from './welcome-routing.module';
import { SharedModule } from 'src/app/shared/shared.module';

@NgModule({
  declarations: [InfoComponent],
  imports: [CommonModule, WelcomeRoutingModule, SharedModule],
})
export class WelcomeModule {}
