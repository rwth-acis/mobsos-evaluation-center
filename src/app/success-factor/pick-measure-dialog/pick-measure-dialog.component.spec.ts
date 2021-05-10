import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import {PickMeasureDialogComponent} from './pick-measure-dialog.component';
import {TranslateLoader, TranslateModule} from '@ngx-translate/core';
import {createTranslateLoader} from '../../app.module';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import { MatCardModule } from '@angular/material/card';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import {SuccessMeasureComponent} from '../../success-measure/success-measure.component';
import {MatIconModule} from '@angular/material/icon';

describe('PickMeasureDialogComponent', () => {
  let component: PickMeasureDialogComponent;
  let fixture: ComponentFixture<PickMeasureDialogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [PickMeasureDialogComponent, SuccessMeasureComponent],
      imports: [
        BrowserAnimationsModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useFactory: (createTranslateLoader)
          },
        }),
        MatDialogModule,
        MatCardModule,
        MatIconModule,
      ],
      providers: [{provide: MatDialogRef, useValue: {}}, {
        provide: MAT_DIALOG_DATA, useValue: {
          measures: [],
          service: {}
        }
      }]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PickMeasureDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
