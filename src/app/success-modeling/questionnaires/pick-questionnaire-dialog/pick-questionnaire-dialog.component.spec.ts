import {
  async,
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';

import { PickQuestionnaireDialogComponent } from './pick-questionnaire-dialog.component';
import {
  TranslateLoader,
  TranslateModule,
} from '@ngx-translate/core';
import { createTranslateLoader } from '../../../app.module';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('PickQuestionnaireDialogComponent', () => {
  let component: PickQuestionnaireDialogComponent;
  let fixture: ComponentFixture<PickQuestionnaireDialogComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [PickQuestionnaireDialogComponent],
        imports: [
          BrowserAnimationsModule,
          TranslateModule.forRoot({
            loader: {
              provide: TranslateLoader,
              useFactory: createTranslateLoader,
            },
          }),
          MatIconModule,
          MatSelectModule,
          MatFormFieldModule,
          MatDialogModule,
          MatButtonModule,
          FormsModule,
          MatCheckboxModule,
        ],
        providers: [{ provide: MAT_DIALOG_DATA, useValue: [] }],
      }).compileComponents();
    }),
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(
      PickQuestionnaireDialogComponent,
    );
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
