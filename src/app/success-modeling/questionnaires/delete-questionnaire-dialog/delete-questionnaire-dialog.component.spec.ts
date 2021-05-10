import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {DeleteQuestionnaireDialogComponent} from './delete-questionnaire-dialog.component';
import {TranslateLoader, TranslateModule} from '@ngx-translate/core';
import {createTranslateLoader} from '../../../app.module';
import {FormsModule} from '@angular/forms';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatDialogModule} from '@angular/material/dialog';

describe('DeleteQuestionnaireDialogComponent', () => {
  let component: DeleteQuestionnaireDialogComponent;
  let fixture: ComponentFixture<DeleteQuestionnaireDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [DeleteQuestionnaireDialogComponent],
      imports: [
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useFactory: (createTranslateLoader)
          },
        }),
        FormsModule,
        MatCheckboxModule,
        MatDialogModule,
      ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeleteQuestionnaireDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
