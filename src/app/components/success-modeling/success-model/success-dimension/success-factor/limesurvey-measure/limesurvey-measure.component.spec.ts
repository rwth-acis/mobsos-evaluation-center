import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog';
import { provideMockStore } from '@ngrx/store/testing';
import {
  TranslateModule,
  TranslateLoader,
} from '@ngx-translate/core';
import { createTranslateLoader } from 'src/app/app.module';
import { initialState } from 'src/app/services/store/store.reducer';

import { LimesurveyMeasureComponent } from './limesurvey-measure.component';

describe('LimesurveyMeasureComponent', () => {
  let component: LimesurveyMeasureComponent;
  let fixture: ComponentFixture<LimesurveyMeasureComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LimesurveyMeasureComponent],
      imports: [
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useFactory: createTranslateLoader,
          },
        }),
        MatDialogModule,
      ],
      providers: [provideMockStore({ initialState })],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LimesurveyMeasureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
