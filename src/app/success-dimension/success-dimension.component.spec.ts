import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {SuccessDimensionComponent} from './success-dimension.component';
import {MatCardModule, MatDialogModule, MatIconModule, MatTooltipModule} from '@angular/material';
import {SuccessFactorComponent} from '../success-factor/success-factor.component';
import {SuccessMeasureComponent} from '../success-measure/success-measure.component';
import {TranslateLoader, TranslateModule} from '@ngx-translate/core';
import {createTranslateLoader} from '../app.module';
import {HttpClientTestingModule} from '@angular/common/http/testing';

describe('SuccessDimensionComponent', () => {
  let component: SuccessDimensionComponent;
  let fixture: ComponentFixture<SuccessDimensionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SuccessDimensionComponent, SuccessFactorComponent, SuccessMeasureComponent],
      imports: [
        MatIconModule,
        MatCardModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useFactory: (createTranslateLoader)
          }
        }),
        HttpClientTestingModule,
        MatTooltipModule,
        MatDialogModule,
      ],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SuccessDimensionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
