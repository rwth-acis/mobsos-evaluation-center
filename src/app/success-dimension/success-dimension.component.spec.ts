import {
  async,
  ComponentFixture,
  TestBed,
  waitForAsync,
} from '@angular/core/testing';

import { SuccessDimensionComponent } from './success-dimension.component';
import { SuccessFactorComponent } from '../success-factor/success-factor.component';
import { SuccessMeasureComponent } from '../success-measure/success-measure.component';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import {
  TranslateLoader,
  TranslateModule,
} from '@ngx-translate/core';
import { createTranslateLoader } from '../app.module';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule } from '@angular/material/dialog';
import { INITIAL_APP_STATE } from '../models/state.model';

describe('SuccessDimensionComponent', () => {
  const initialState = INITIAL_APP_STATE;
  let component: SuccessDimensionComponent;
  let fixture: ComponentFixture<SuccessDimensionComponent>;
  let store: MockStore;
  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [
          SuccessDimensionComponent,
          SuccessFactorComponent,
          SuccessMeasureComponent,
        ],
        imports: [
          MatIconModule,
          MatCardModule,
          TranslateModule.forRoot({
            loader: {
              provide: TranslateLoader,
              useFactory: createTranslateLoader,
            },
          }),
          HttpClientTestingModule,
          MatTooltipModule,
          MatDialogModule,
        ],
        providers: [provideMockStore({ initialState })],
      }).compileComponents();
    }),
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(SuccessDimensionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    store = TestBed.inject(MockStore);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
