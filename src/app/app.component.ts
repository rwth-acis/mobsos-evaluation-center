import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import 'oidc-client';
import 'las2peer-frontend-statusbar/las2peer-frontend-statusbar.js';
import { environment } from '../environments/environment';

import { CordovaPopupNavigator, UserManager } from 'oidc-client';

import { DomSanitizer } from '@angular/platform-browser';
import Timer = NodeJS.Timer;
import { FormControl } from '@angular/forms';
import { Store } from '@ngrx/store';
import {
  fetchGroups,
  fetchMeasureCatalog,
  fetchServices,
  fetchSuccessModel,
  setGroup,
  storeUser,
  toggleExpertMode,
} from './services/store.actions';
import {
  EXPERT_MODE,
  HTTP_CALL_IS_LOADING,
  ROLE_IN_CURRENT_WORKSPACE,
  SELECTED_GROUP,
  USER,
  USER_GROUPS,
  _SELECTED_GROUP_ID,
  _SELECTED_SERVICE_NAME,
} from './services/store.selectors';
import {
  distinctUntilKeyChanged,
  filter,
  first,
  map,
  withLatestFrom,
} from 'rxjs/operators';
import { combineLatest, Observable, Subscription } from 'rxjs';
import { MatSidenav } from '@angular/material/sidenav';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatIconRegistry } from '@angular/material/icon';
import { User } from './models/user.model';
import { GroupInformation } from './models/community.model';
import { LanguageService } from './services/language.service';
import { MatDialog } from '@angular/material/dialog';
import { AddCommunityDialogComponent } from './add-community-dialog/add-community-dialog.component';
import { StoreState } from './models/state.model';

// workaround for openidconned-signin
// remove when the lib imports with "import {UserManager} from 'oidc-client';" instead of "import 'oidc-client';"
// this kind of import does not work with oidc-client@1.6.1 for some strange reason
declare global {
  interface Window {
    UserManager: any;
    CordovaPopupNavigator: any;
  }
}
window.UserManager = UserManager;
window.CordovaPopupNavigator = CordovaPopupNavigator;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent
  implements OnInit, OnDestroy, AfterViewInit
{
  @ViewChild(MatSidenav)
  public sidenav: MatSidenav;
  selectedGroupForm = new FormControl('');
  title = 'MobSOS Evaluation Center';

  mobileQuery: MediaQueryList;
  mobileQueryListener: () => void; // what is this used for? Do we still need it?
  environment = environment; // set it so that it can be accessed in the template
  mobsosSurveysUrl = environment.mobsosSurveysUrl;
  reqBazFrontendUrl = environment.reqBazFrontendUrl;

  // Observables
  loading$ = this.ngrxStore.select(HTTP_CALL_IS_LOADING);
  expertMode$ = this.ngrxStore.select(EXPERT_MODE);

  role$ = this.ngrxStore.select(ROLE_IN_CURRENT_WORKSPACE);
  subscriptions$: Subscription[] = [];
  userGroups$: Observable<GroupInformation[]> =
    this.ngrxStore.select(USER_GROUPS);
  user$: Observable<User> = this.ngrxStore
    .select(USER)
    .pipe(filter((user) => !!user));

  groupsAreLoaded$: Observable<boolean> = combineLatest([
    this.userGroups$,
    this.user$,
  ]).pipe(map(([userGroups, user]) => user && !!userGroups));

  selectedGroupId$ = this.ngrxStore.select(SELECTED_GROUP).pipe(
    filter((group) => !!group),
    distinctUntilKeyChanged('id'),
    map((group) => group.id),
  );

  selectedGroupId: string; // used to show the selected group in the form field

  private userManager = new UserManager({});
  private silentSigninIntervalHandle: Timer;

  constructor(
    public languageService: LanguageService, // public so that we can access it in the template
    private changeDetectorRef: ChangeDetectorRef,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer,
    private ngrxStore: Store,
  ) {
    this.matIconRegistry.addSvgIcon(
      'reqbaz-logo',
      this.domSanitizer.bypassSecurityTrustResourceUrl(
        'assets/icons/reqbaz-logo.svg',
      ),
    );
    this.mobileQuery = window.matchMedia('(max-width: 600px)');
    this.mobileQueryListener = () =>
      this.changeDetectorRef.detectChanges();
    this.mobileQuery.addEventListener(
      'change',
      this.mobileQueryListener,
      false,
    );
  }

  ngOnInit(): void {
    let sub = this.selectedGroupId$.subscribe((id) => {
      this.selectedGroupId = id;
    });
    this.subscriptions$.push(sub);

    const silentLoginFunc = () =>
      this.userManager
        .signinSilentCallback()
        .then(() => {})
        .catch(() => {
          this.setUser(null);
          console.error('Silent login failed');
        });
    void silentLoginFunc();

    sub = this.user$
      .pipe(distinctUntilKeyChanged('signedIn'))
      .subscribe((user) => {
        clearInterval(this.silentSigninIntervalHandle);
        if (user?.signedIn) {
          this.silentSigninIntervalHandle = setInterval(
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            silentLoginFunc,
            environment.openIdSilentLoginInterval * 1000,
          );
        }
      });
    this.subscriptions$.push(sub);

    if (!environment.production) {
      this.title = 'MobSOS Evaluation Center (dev)';
      this.snackBar.open(
        'You are currently in the development network. Please note that some features might not be available/ fully functional yet',
        'OK',
        { duration: 10000 },
      );
      // Logging in dev mode
      sub = this.ngrxStore
        .pipe(map((store: StoreState) => store.Reducer))
        .subscribe((state) => {
          console.log(state);
        });
      this.subscriptions$.push(sub);

      // sub = this.ngrxStore
      //   .select(APPLICATION_WORKSPACE)
      //   .subscribe((a) => {
      //     console.log(a);
      //   });
      // this.subscriptions$.push(sub);
    }
  }

  ngAfterViewInit(): void {
    const sub = this.ngrxStore
      .select(USER)
      .pipe(
        filter((user) => !!user),
        distinctUntilKeyChanged('signedIn'),
        filter((user) => !!user?.signedIn),
        withLatestFrom(
          this.ngrxStore.select(_SELECTED_GROUP_ID),
          this.ngrxStore.select(_SELECTED_SERVICE_NAME),
        ),
        first(),
      )
      .subscribe(([, groupId, serviceName]) => {
        // only gets called once if user is signed in
        // initial fetching
        this.ngrxStore.dispatch(fetchGroups());
        this.ngrxStore.dispatch(fetchServices());
        if (groupId) {
          this.ngrxStore.dispatch(fetchMeasureCatalog({ groupId }));
          if (serviceName) {
            this.ngrxStore.dispatch(
              fetchSuccessModel({ groupId, serviceName }),
            );
          }
        }
      });
    this.subscriptions$.push(sub);
  }

  ngOnDestroy(): void {
    this.mobileQuery.removeEventListener(
      'change',
      this.mobileQueryListener,
      false,
    );
    this.subscriptions$.forEach((sub) => sub.unsubscribe());
  }

  useLanguage(language: string): void {
    this.languageService.changeLanguage(language);
  }

  toggleExpertMode(): void {
    this.ngrxStore.dispatch(toggleExpertMode());
  }

  setUser(user: User): void {
    this.ngrxStore.dispatch(storeUser({ user }));
  }

  onGroupSelected(groupId: string): void {
    if (groupId) {
      this.ngrxStore.dispatch(setGroup({ groupId }));
    }
  }

  menuItemClicked(): void {
    if (this.mobileQuery.matches) {
      void this.sidenav.toggle(); // closes the menu if an item is clicked on mobile devices
    }
  }

  openAddCommunityDialog(): void {
    this.dialog.open(AddCommunityDialogComponent, {
      data: null,
      disableClose: true,
    });
  }
}
