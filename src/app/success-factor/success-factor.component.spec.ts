import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import {SuccessFactorComponent} from './success-factor.component';
import {SuccessMeasureComponent} from '../success-measure/success-measure.component';
import {TranslateLoader, TranslateModule} from '@ngx-translate/core';
import {createTranslateLoader} from '../app.module';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

describe('SuccessFactorComponent', () => {
  let component: SuccessFactorComponent;
  let fixture: ComponentFixture<SuccessFactorComponent>;

  beforeEach(waitForAsync(() => {
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
