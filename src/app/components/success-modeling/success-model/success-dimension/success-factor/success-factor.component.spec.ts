import {
  ComponentFixture,
  TestBed,
  waitForAsync,
} from '@angular/core/testing';

import { SuccessFactorComponent } from './success-factor.component';
import { SuccessMeasureComponent } from 'src/app/components/success-modeling/success-model/success-dimension/success-factor/success-measure/success-measure.component';
import {
  TranslateLoader,
  TranslateModule,
} from '@ngx-translate/core';
import { createTranslateLoader } from 'src/app/app.module';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule } from '@angular/material/dialog';
import { INITIAL_APP_STATE } from 'src/app/models/state.model';
import { provideMockStore } from '@ngrx/store/testing';

describe('SuccessFactorComponent', () => {
  let component: SuccessFactorComponent;
  let fixture: ComponentFixture<SuccessFactorComponent>;
  const initialState = INITIAL_APP_STATE;
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [SuccessFactorComponent, SuccessMeasureComponent],
      imports: [
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useFactory: createTranslateLoader,
          },
        }),
        HttpClientTestingModule,
        MatIconModule,
        MatTooltipModule,
        MatDialogModule,
      ],
      providers: [provideMockStore({ initialState })],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SuccessFactorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
