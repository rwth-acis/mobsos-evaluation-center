import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { Actions } from '@ngrx/effects';
import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { StateEffects } from 'src/app/services/store/store.effects';
import { initialState } from 'src/app/services/store/store.reducer';

import { AddCommunityDialogComponent } from './add-community-dialog.component';

describe('AddCommunityDialogComponent', () => {
  let component: AddCommunityDialogComponent;
  let fixture: ComponentFixture<AddCommunityDialogComponent>;
  let actions: Actions;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AddCommunityDialogComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: [] },
        { provide: MatDialogRef, useValue: {} },
        provideMockStore({ initialState }),
        provideMockActions(() => actions),
        { provide: StateEffects, useValue: { addGroup$: of(null) } },
      ],
      imports: [TranslateModule.forRoot()],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddCommunityDialogComponent);
    component = fixture.componentInstance;
    actions = TestBed.inject(Actions);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
