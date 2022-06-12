import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  TranslateModule,
  TranslateLoader,
} from '@ngx-translate/core';
import { createTranslateLoader } from 'src/app/app.module';

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
      ],
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
