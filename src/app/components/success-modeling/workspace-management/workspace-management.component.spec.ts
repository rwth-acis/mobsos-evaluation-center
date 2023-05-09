import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  MatLegacyDialogModule as MatDialogModule,
  MatLegacyDialogRef as MatDialogRef,
} from '@angular/material/legacy-dialog';
import { provideMockStore } from '@ngrx/store/testing';
import {
  TranslateLoader,
  TranslateModule,
} from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { createTranslateLoader } from 'src/app/app.module';
import { INITIAL_APP_STATE } from 'src/app/models/state.model';
import { StateEffects } from 'src/app/services/store/store.effects';
import { provideMockActions } from '@ngrx/effects/testing';
import { MatLegacyMenuModule as MatMenuModule } from '@angular/material/legacy-menu';
import { WorkspaceManagementComponent } from './workspace-management.component';
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar';

describe('WorkspaceManagementComponent', () => {
  let component: WorkspaceManagementComponent;
  let fixture: ComponentFixture<WorkspaceManagementComponent>;
  const initialState = INITIAL_APP_STATE;
  // eslint-disable-next-line prefer-const
  let actions$: Observable<any>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [WorkspaceManagementComponent],
      imports: [
        MatDialogModule,
        MatMenuModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useFactory: createTranslateLoader,
          },
        }),
      ],
      providers: [
        { provide: MatDialogRef, useValue: {} },
        { provide: MatSnackBar, useValue: {} },
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
    void expect(component).toBeTruthy();
  });
});
