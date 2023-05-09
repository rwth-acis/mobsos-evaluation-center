import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {
  ComponentFixture,
  getTestBed,
  TestBed,
} from '@angular/core/testing';
import { MatLegacySnackBarModule as MatSnackBarModule } from '@angular/material/legacy-snack-bar';
import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { Observable, of } from 'rxjs';
import { StateEffects } from 'src/app/services/store/store.effects';
import { initialState } from 'src/app/services/store/store.reducer';
import { CommunityInfoComponent } from './community-info.component';

describe('CommunityInfoComponent', () => {
  let component: CommunityInfoComponent;
  let fixture: ComponentFixture<CommunityInfoComponent>;
  let httpMock: HttpTestingController;
  let effects: StateEffects;
  let actions: Observable<any>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CommunityInfoComponent],
      providers: [
        provideMockActions(() => actions),

        {
          provide: StateEffects,
          useValue: {
            addUserToGroup$: of(null),
            removeMemberFromGroup$: of(null),
          },
        },
        provideMockStore({ initialState }),
      ],
      imports: [HttpClientTestingModule, MatSnackBarModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CommunityInfoComponent);
    httpMock = TestBed.inject(HttpTestingController);
    component = fixture.componentInstance;
    effects = TestBed.inject(StateEffects);

    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
