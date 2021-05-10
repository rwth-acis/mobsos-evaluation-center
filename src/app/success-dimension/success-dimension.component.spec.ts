import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import {SuccessDimensionComponent} from './success-dimension.component';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import {SuccessFactorComponent} from '../success-factor/success-factor.component';
import {SuccessMeasureComponent} from '../success-measure/success-measure.component';
import {TranslateLoader, TranslateModule} from '@ngx-translate/core';
import {createTranslateLoader} from '../app.module';
import {HttpClientTestingModule} from '@angular/common/http/testing';

describe('SuccessDimensionComponent', () => {
  let component: SuccessDimensionComponent;
  let fixture: ComponentFixture<SuccessDimensionComponent>;

  beforeEach(waitForAsync(() => {
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
