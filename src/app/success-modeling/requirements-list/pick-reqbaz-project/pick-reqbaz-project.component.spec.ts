import {
  async,
  ComponentFixture,
  TestBed,
  waitForAsync,
} from '@angular/core/testing';

import { PickReqbazProjectComponent } from './pick-reqbaz-project.component';
import {
  TranslateLoader,
  TranslateModule,
} from '@ngx-translate/core';
import { createTranslateLoader } from '../../../app.module';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDialogModule } from '@angular/material/dialog';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { LoggerModule, NgxLoggerLevel } from 'ngx-logger';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('PickReqbazProjectComponent', () => {
  let component: PickReqbazProjectComponent;
  let fixture: ComponentFixture<PickReqbazProjectComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [PickReqbazProjectComponent],
        imports: [
          BrowserAnimationsModule,
          TranslateModule.forRoot({
            loader: {
              provide: TranslateLoader,
              useFactory: createTranslateLoader,
            },
          }),
          LoggerModule.forRoot({
            level: NgxLoggerLevel.TRACE,
            serverLogLevel: NgxLoggerLevel.OFF,
          }),
          MatFormFieldModule,
          MatAutocompleteModule,
          MatDialogModule,
          FormsModule,
          MatInputModule,
          ReactiveFormsModule,
          HttpClientTestingModule,
        ],
      }).compileComponents();
    }),
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(PickReqbazProjectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
