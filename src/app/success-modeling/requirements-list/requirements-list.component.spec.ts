import {
  ComponentFixture,
  TestBed,
  waitForAsync,
} from '@angular/core/testing';

import { RequirementsListComponent } from './requirements-list.component';
import {
  TranslateLoader,
  TranslateModule,
} from '@ngx-translate/core';
import { createTranslateLoader } from '../../app.module';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { SuccessModel } from '../../../success-model/success-model';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { LoggerModule, NgxLoggerLevel } from 'ngx-logger';
import { provideMockStore } from '@ngrx/store/testing';
import { INITIAL_APP_STATE } from 'src/app/models/state.model';

describe('RequirementsListComponent', () => {
  let component: RequirementsListComponent;
  let fixture: ComponentFixture<RequirementsListComponent>;
  const initialState = INITIAL_APP_STATE;
  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [RequirementsListComponent],
        imports: [
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
          MatExpansionModule,
          MatButtonModule,
          MatDialogModule,
          HttpClientTestingModule,
        ],
        providers: [provideMockStore({ initialState })],
      }).compileComponents();
    }),
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(RequirementsListComponent);
    component = fixture.componentInstance;
    component.successModel = new SuccessModel(
      'TestModel',
      'TestService',
      {
        'System Quality': [],
        'Information Quality': [],
        Use: [],
        'User Satisfaction': [],
        'Individual Impact': [],
        'Community Impact': [],
      },
      [],
      null,
    );
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
