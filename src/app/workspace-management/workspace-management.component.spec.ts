import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import {
  TranslateLoader,
  TranslateModule,
} from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { createTranslateLoader } from '../app.module';
import { AppState, INITIAL_APP_STATE } from '../models/state.model';
import { StateEffects } from '../services/store.effects';
import { provideMockActions } from '@ngrx/effects/testing';

import { WorkspaceManagementComponent } from './workspace-management.component';

describe('WorkspaceManagementComponent', () => {
  let component: WorkspaceManagementComponent;
  let fixture: ComponentFixture<WorkspaceManagementComponent>;
  const initialState = INITIAL_APP_STATE;
  let actions$: Observable<any>;
  let effects: StateEffects;
  let store: MockStore<AppState>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [WorkspaceManagementComponent],
      imports: [
        MatDialogModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useFactory: createTranslateLoader,
          },
        }),
      ],
      providers: [
        { provide: MatDialogRef, useValue: {} },
        provideMockStore({ initialState }),
        provideMockActions(() => actions$),
        StateEffects,
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkspaceManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
