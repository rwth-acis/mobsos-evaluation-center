import {
  async,
  ComponentFixture,
  TestBed,
  waitForAsync,
} from '@angular/core/testing';

import { SuccessDimensionComponent } from './success-dimension.component';
import { SuccessFactorComponent } from 'src/app/components/success-modeling/success-model/success-dimension/success-factor/success-factor.component';
import { SuccessMeasureComponent } from 'src/app/components/success-modeling/success-model/success-dimension/success-factor/success-measure/success-measure.component';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import {
  TranslateLoader,
  TranslateModule,
} from '@ngx-translate/core';
import { createTranslateLoader } from 'src/app/app.module';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyTooltipModule as MatTooltipModule } from '@angular/material/legacy-tooltip';
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog';
import { INITIAL_APP_STATE } from 'src/app/models/state.model';

describe('SuccessDimensionComponent', () => {
  const initialState = INITIAL_APP_STATE;
  let component: SuccessDimensionComponent;
  let fixture: ComponentFixture<SuccessDimensionComponent>;
  let store: MockStore;
  beforeEach(waitForAsync(() => {
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
  }));

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
