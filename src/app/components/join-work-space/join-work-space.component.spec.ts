import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { initialState } from 'src/app/services/store/store.reducer';

import { JoinWorkSpaceComponent } from './join-work-space.component';

describe('JoinWorkSpaceComponent', () => {
  let component: JoinWorkSpaceComponent;
  let fixture: ComponentFixture<JoinWorkSpaceComponent>;
  const fakeActivatedRoute = {
    snapshot: { data: {} },
    params: of(null),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [JoinWorkSpaceComponent],
      providers: [
        { provide: ActivatedRoute, useValue: fakeActivatedRoute },
        provideMockStore({ initialState }),
      ],
      imports: [
        MatDialogModule,
        RouterTestingModule,
        TranslateModule.forRoot(),
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(JoinWorkSpaceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
