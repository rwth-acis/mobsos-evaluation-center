import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  MatSnackBar,
  MatSnackBarModule,
} from '@angular/material/snack-bar';
import { RouterTestingModule } from '@angular/router/testing';
import { Actions } from '@ngrx/effects';
import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore } from '@ngrx/store/testing';
import {
  TranslateLoader,
  TranslateModule,
} from '@ngx-translate/core';
import { of } from 'rxjs';
import { createTranslateLoader } from 'src/app/app.module';
import { StateEffects } from 'src/app/services/store/store.effects';
import { initialState } from 'src/app/services/store/store.reducer';

import { SuccessModelComponent } from './success-model.component';

describe('SuccessModelComponent', () => {
  let component: SuccessModelComponent;
  let fixture: ComponentFixture<SuccessModelComponent>;
  let actions: Actions;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SuccessModelComponent],
      imports: [
        MatSnackBarModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useFactory: createTranslateLoader,
          },
        }),
      ],
      providers: [
        provideMockStore({ initialState }),
        provideMockActions(() => actions),
        {
          provide: StateEffects,
          useValue: { saveModelAndCatalog$: of(null) },
        },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SuccessModelComponent);
    component = fixture.componentInstance;
    TestBed.inject(Actions);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
