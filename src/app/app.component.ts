import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import 'oidc-client';
import 'las2peer-frontend-statusbar/las2peer-frontend-statusbar.js';
import { environment } from '../environments/environment';
import { NGXLogger } from 'ngx-logger';

import { CordovaPopupNavigator, UserManager } from 'oidc-client';

import { SwUpdate } from '@angular/service-worker';
import { TranslateService } from '@ngx-translate/core';
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
  FOREIGN_GROUPS,
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
  mobileQueryListener: () => void;
  environment = environment;
  mobsosSurveysUrl = environment.mobsosSurveysUrl;
  reqBazFrontendUrl = environment.reqBazFrontendUrl;

  // Observables
  loading$ = this.ngrxStore.select(HTTP_CALL_IS_LOADING);
  expertMode$ = this.ngrxStore.select(EXPERT_MODE);
  selectedGroup$ = this.ngrxStore.select(SELECTED_GROUP);
  role$ = this.ngrxStore.select(ROLE_IN_CURRENT_WORKSPACE);
  subscriptions$: Subscription[] = [];
  userGroups$: Observable<GroupInformation[]> =
    this.ngrxStore.select(USER_GROUPS);
  user$: Observable<User> = this.ngrxStore
    .select(USER)
    .pipe(filter((user) => !!user));
  foreignGroups$: Observable<GroupInformation[]> =
    this.ngrxStore.select(FOREIGN_GROUPS);
  groupsAreLoaded$: Observable<boolean> = combineLatest([
    this.userGroups$,
    this.foreignGroups$,
    this.user$,
  ]).pipe(
    map(
      ([userGroups, foreignGroups, user]) =>
        user && (!!userGroups || !!foreignGroups),
    ),
  );
  selectedGroupId: string; // used to show the selected group in the form field

  private userManager = new UserManager({});
  private silentSigninIntervalHandle: Timer;

  constructor(
    private logger: NGXLogger,
    public languageService: LanguageService,
    changeDetectorRef: ChangeDetectorRef,
    private elementRef: ElementRef,
    private dialog: MatDialog,
    private swUpdate: SwUpdate,
    private snackBar: MatSnackBar,
    private translate: TranslateService,
    private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer,
    private ngrxStore: Store,
  ) {
    if (!environment.production) {
      this.title = 'MobSOS Evaluation Center (dev)';
      this.snackBar.open(
        'You are currently in the development network. Please note that some features might not be available/ fully functional yet',
        'OK',
        { duration: 10000 },
      );
    }
    this.matIconRegistry.addSvgIcon(
      'reqbaz-logo',
      this.domSanitizer.bypassSecurityTrustResourceUrl(
        'assets/icons/reqbaz-logo.svg',
      ),
    );
    this.mobileQuery = window.matchMedia('(max-width: 600px)');
    this.mobileQueryListener = () =>
      changeDetectorRef.detectChanges();
    this.mobileQuery.addEventListener(
      'change',
      this.mobileQueryListener,
      false,
    );
  }

  ngAfterViewInit() {
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
    this.logger.debug(`Changing language to ${language}`);
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
      void this.sidenav.toggle();
    }
  }

  ngOnInit(): void {
    let sub = this.selectedGroup$
      .pipe(
        filter((group) => !!group),
        distinctUntilKeyChanged('id'),
      )
      .subscribe((group) => {
        this.selectedGroupId = group.id;
      });
    this.subscriptions$.push(sub);

    const silentLoginFunc = () => {
      this.userManager
        .signinSilentCallback()
        .then(() => {})
        .catch(() => {
          this.setUser(null);
          this.logger.debug('Silent login failed');
        });
    };
    silentLoginFunc();

    sub = this.user$
      .pipe(distinctUntilKeyChanged('signedIn'))
      .subscribe((user) => {
        clearInterval(this.silentSigninIntervalHandle);
        if (user?.signedIn) {
          this.silentSigninIntervalHandle = setInterval(
            silentLoginFunc,
            environment.openIdSilentLoginInterval * 1000,
          );
        }
      });
    this.subscriptions$.push(sub);

    if (!environment.production) {
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

  openAddCommunityDialog(): void {
    this.dialog.open(AddCommunityDialogComponent, {
      data: null,
      disableClose: true,
    });
  }
}
