import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InfoComponent } from './info/info.component';
import { WelcomeRoutingModule } from './welcome-routing.module';

@NgModule({
  declarations: [InfoComponent],
  imports: [CommonModule, WelcomeRoutingModule],
})
export class WelcomeModule {}
