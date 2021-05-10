import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {EditFactorDialogComponent} from './edit-factor-dialog.component';
import {TranslateLoader, TranslateModule} from '@ngx-translate/core';
import {createTranslateLoader} from '../../app.module';
import {FormsModule} from '@angular/forms';
import {MatDialogModule, MatDialogRef, MatFormFieldModule, MatInputModule} from '@angular/material';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';
import {SuccessFactor} from '../../../success-model/success-factor';

describe('EditFactorDialogComponent', () => {
  let component: EditFactorDialogComponent;
  let fixture: ComponentFixture<EditFactorDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [EditFactorDialogComponent],
      imports: [
        BrowserAnimationsModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useFactory: (createTranslateLoader)
          },
        }),
        FormsModule,
        MatFormFieldModule,
        MatDialogModule,
        MatInputModule,
      ],
      providers: [
        {provide: MatDialogRef, useValue: {}},
        {provide: MAT_DIALOG_DATA, useValue: {factor: new SuccessFactor('FactorName', [])}}
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditFactorDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
