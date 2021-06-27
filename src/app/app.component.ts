import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  isDevMode,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import 'oidc-client';
import 'las2peer-frontend-statusbar/las2peer-frontend-statusbar.js';
import { MediaMatcher } from '@angular/cdk/layout';
import { environment } from '../environments/environment';
import { NGXLogger } from 'ngx-logger';

import { CordovaPopupNavigator, UserManager } from 'oidc-client';

import * as Hammer from 'hammerjs';
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
  _EXPERT_MODE,
  FOREIGN_GROUPS,
  HTTP_CALL_IS_LOADING,
  ROLE_IN_CURRENT_WORKSPACE,
  SELECTED_GROUP,
  _USER,
  USER_GROUPS,
  _EDIT_MODE,
  SUCCESS_MODEL,
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
export class AppComponent implements OnInit, OnDestroy {
  @ViewChild(MatSidenav)
  public sidenav: MatSidenav;
  selectedGroupForm = new FormControl('');
  title = 'MobSOS Evaluation Center';
  mobileQuery: MediaQueryList;
  mobileQueryListener: () => void;
  environment = environment;
  mobsosSurveysUrl = environment.mobsosSurveysUrl;
  reqBazFrontendUrl = environment.reqBazFrontendUrl;
  private userManager = new UserManager({});
  private silentSigninIntervalHandle: Timer;

  // Observables
  loading$ = this.ngrxStore.select(HTTP_CALL_IS_LOADING);
  expertMode$ = this.ngrxStore.select(_EXPERT_MODE);
  selectedGroup$ = this.ngrxStore.select(SELECTED_GROUP);
  role$ = this.ngrxStore.select(ROLE_IN_CURRENT_WORKSPACE);
  subscriptions$: Subscription[] = [];
  userGroups$: Observable<GroupInformation[]> =
    this.ngrxStore.select(USER_GROUPS);
  user$: Observable<User> = this.ngrxStore
    .select(_USER)
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

  constructor(
    private logger: NGXLogger,
    public languageService: LanguageService,
    changeDetectorRef: ChangeDetectorRef,
    media: MediaMatcher,
    private elementRef: ElementRef,
    private swUpdate: SwUpdate,
    private snackBar: MatSnackBar,
    private translate: TranslateService,
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
    this.mobileQuery = media.matchMedia('(max-width: 600px)');
    this.mobileQueryListener = () =>
      changeDetectorRef.detectChanges();
    this.mobileQuery.addEventListener(
      'change',
      this.mobileQueryListener,
      false,
    );
  }

  ngOnDestroy(): void {
    this.mobileQuery.removeEventListener(
      'change',
      this.mobileQueryListener,
      false,
    );
    this.subscriptions$.forEach((sub) => sub.unsubscribe());
  }

  useLanguage(language: string) {
    this.logger.debug(`Changing language to ${language}`);
    this.languageService.changeLanguage(language);
  }

  toggleExpertMode() {
    this.ngrxStore.dispatch(toggleExpertMode());
  }

  setUser(user: User) {
    this.ngrxStore.dispatch(storeUser({ user }));
  }

  onGroupSelected(groupId: string) {
    if (groupId) {
      this.ngrxStore.dispatch(setGroup({ groupId }));
    }
  }

  menuItemClicked() {
    if (this.mobileQuery.matches) {
      this.sidenav.toggle();
    }
  }

  ngOnInit(): void {
    let sub = this.ngrxStore
      .select(_USER)
      .pipe(
        filter((user) => !!user),
        distinctUntilKeyChanged('signedIn'),
        filter((user) => user?.signedIn),
        withLatestFrom(
          this.ngrxStore.select(_SELECTED_GROUP_ID),
          this.ngrxStore.select(_SELECTED_SERVICE_NAME),
        ),
        first(),
      )
      .subscribe(([user, groupId, serviceName]) => {
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

    sub = this.selectedGroup$
      .pipe(
        filter((group) => !!group),
        distinctUntilKeyChanged('id'),
      )
      .subscribe((group) => {
        this.selectedGroupId = group.id;
      });
    this.subscriptions$.push(sub);

    // swipe navigation
    const hammertime = new Hammer(this.elementRef.nativeElement, {});
    hammertime.on('panright', (event) => {
      if (this.mobileQuery.matches) {
        if (event.center.x >= 1 && event.center.x <= 20) {
          this.sidenav.open();
        }
      }
    });
    hammertime.on('panleft', (event) => {
      if (this.mobileQuery.matches) {
        this.sidenav.close();
      }
    });
    if (this.swUpdate.isEnabled) {
      sub = this.swUpdate.available.subscribe(async () => {
        const message = await this.translate
          .get('app.update.message')
          .toPromise();
        const reloadAction = await this.translate
          .get('app.update.reload')
          .toPromise();
        const snackBarRef = this.snackBar.open(
          message,
          reloadAction,
          null,
        );
        snackBarRef.onAction().subscribe(() => {
          window.location.reload();
        });
      });
      this.subscriptions$.push(sub);
    }

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

    if (isDevMode() || !environment.production) {
      // Logging in dev mode
      sub = this.ngrxStore.subscribe((state) => {
        console.log(state);
      });
      this.subscriptions$.push(sub);

      sub = this.ngrxStore.select(SUCCESS_MODEL).subscribe((a) => {
        console.log(a);
      });
      this.subscriptions$.push(sub);
    }
  }
}
