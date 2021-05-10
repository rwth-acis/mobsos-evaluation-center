import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {ErrorDialogComponent} from './error-dialog.component';
import {TranslateLoader, TranslateModule} from '@ngx-translate/core';
import {createTranslateLoader} from '../app.module';
import {MAT_DIALOG_DATA} from '@angular/material';
import {HttpClientTestingModule} from '@angular/common/http/testing';

describe('ErrorDialogComponent', () => {
  let component: ErrorDialogComponent;
  let fixture: ComponentFixture<ErrorDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ErrorDialogComponent],
      imports: [
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useFactory: (createTranslateLoader)
          }
        }),
        HttpClientTestingModule
      ],
      providers: [{
        provide: MAT_DIALOG_DATA,
        useValue: {
          error: 'some error',
        }
      }]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ErrorDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
