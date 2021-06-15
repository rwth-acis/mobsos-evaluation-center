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
import { LanguageService } from './language.service';

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
  initState,
  setGroup,
  storeUser,
  toggleExpertMode,
} from './services/store.actions';
import {
  COMMUNITY_WORKSPACE,
  EXPERT_MODE,
  FOREIGN_GROUPS,
  HTTP_CALL_IS_LOADING,
  SELECTED_GROUP,
  USER,
  USER_GROUPS,
} from './services/store.selectors';
import {
  distinctUntilKeyChanged,
  filter,
  first,
  map,
} from 'rxjs/operators';
import { combineLatest, Observable, Subscription } from 'rxjs';
import { MatSidenav } from '@angular/material/sidenav';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatIconRegistry } from '@angular/material/icon';
import { User } from './models/user.model';
import { GroupInformation } from './models/community.model';

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

  title = 'MobSOS Evaluation Center';
  mobileQuery: MediaQueryList;
  mobileQueryListener: () => void;
  environment = environment;
  LOCAL_STORAGE_EXPERT_MODE = 'expert-mode';
  expertMode = false;
  myGroups: GroupInformation[] = [];
  userGroups$: Observable<GroupInformation[]> =
    this.ngrxStore.select(USER_GROUPS);
  user$: Observable<User> = this.ngrxStore.select(USER);
  loggedIn$ = this.user$.pipe(map((user) => user && user.signedIn));
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
  otherGroups: GroupInformation[] = [];
  groups = [];
  groupMap = {};
  selectedGroup;
  selectedGroupForm = new FormControl('');
  user;
  signedIn = false;
  mobsosSurveysUrl = environment.mobsosSurveysUrl;
  reqBazFrontendUrl = environment.reqBazFrontendUrl;
  private userManager = new UserManager({});
  private silentSigninIntervalHandle: Timer;
  loading$ = this.ngrxStore.select(HTTP_CALL_IS_LOADING);
  expertMode$ = this.ngrxStore.select(EXPERT_MODE);
  selectedGroup$ = this.ngrxStore.select(SELECTED_GROUP);
  subscriptions$: Subscription[] = [];

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

  setExpertMode(mode) {
    this.expertMode = mode;
    this.ngrxStore.dispatch(toggleExpertMode());
  }

  setUser(user) {
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
    let sub = this.user$
      .pipe(
        filter((user) => !!user),
        distinctUntilKeyChanged('signedIn'),
      )
      .subscribe((user) => {
        if (user) {
          this.ngrxStore.dispatch(fetchGroups());
        }
        this.ngrxStore.dispatch(fetchServices());
      });
    this.subscriptions$.push(sub);
    this.ngrxStore.dispatch(initState());

    sub = this.selectedGroup$
      .pipe(
        filter((group) => !!group && !!group.name),
        first(),
      )
      .subscribe((group) => {
        if (this.selectedGroupForm.value !== group.name) {
          this.ngrxStore.dispatch(
            fetchMeasureCatalog({ groupId: group.id }),
          ); // initial fetch of measure catalog
          if (group?.name) this.selectedGroupForm.reset(group.name);
        }
      });
    this.subscriptions$.push(sub);
    if (isDevMode()) {
      sub = this.ngrxStore.subscribe((state) => {
        console.log(state);
      });
      this.subscriptions$.push(sub);
      // sub = this.ngrxStore
      //   .select(COMMUNITY_WORKSPACE)
      //   .subscribe((a) => {
      //     console.log(a);
      //   });
      // this.subscriptions$.push(sub);
    }

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
      this.swUpdate.available.subscribe(async () => {
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
    }
    this.expertMode = !!localStorage.getItem(
      this.LOCAL_STORAGE_EXPERT_MODE,
    );

    sub = this.selectedGroup$.subscribe((selectedGroup) => {
      this.selectedGroup = selectedGroup?.id;
      if (selectedGroup?.id) {
        this.ngrxStore.dispatch(
          fetchMeasureCatalog({ groupId: selectedGroup.id }),
        );
        this.selectedGroupForm.setValue(selectedGroup.id);
      }
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

    sub = this.user$.subscribe((user) => {
      this.user = user;
      this.signedIn = !!user;
      clearInterval(this.silentSigninIntervalHandle);
      if (this.signedIn) {
        this.silentSigninIntervalHandle = setInterval(
          silentLoginFunc,
          environment.openIdSilentLoginInterval * 1000,
        );
      }
    });
    this.subscriptions$.push(sub);
  }
}
