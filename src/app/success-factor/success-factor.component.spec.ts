import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {SuccessFactorComponent} from './success-factor.component';
import {SuccessMeasureComponent} from '../success-measure/success-measure.component';
import {TranslateLoader, TranslateModule} from '@ngx-translate/core';
import {createTranslateLoader} from '../app.module';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {MatDialogModule, MatIconModule, MatTooltipModule} from '@angular/material';

describe('SuccessFactorComponent', () => {
  let component: SuccessFactorComponent;
  let fixture: ComponentFixture<SuccessFactorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SuccessFactorComponent, SuccessMeasureComponent],
      imports: [
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useFactory: (createTranslateLoader)
          }
        }),
        HttpClientTestingModule,
        MatIconModule,
        MatTooltipModule,
        MatDialogModule,
      ],
    })
      .compileComponents();
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
