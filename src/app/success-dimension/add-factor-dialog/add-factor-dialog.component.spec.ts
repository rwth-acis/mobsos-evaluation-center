import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {AddFactorDialogComponent} from './add-factor-dialog.component';
import {TranslateLoader, TranslateModule} from '@ngx-translate/core';
import {createTranslateLoader} from '../../app.module';
import {FormsModule} from '@angular/forms';
import {MatDialogModule, MatDialogRef, MatFormFieldModule, MatInputModule} from '@angular/material';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

describe('AddFactorDialogComponent', () => {
  let component: AddFactorDialogComponent;
  let fixture: ComponentFixture<AddFactorDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AddFactorDialogComponent],
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
      providers: [{provide: MatDialogRef, useValue: {}}]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddFactorDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
