import {
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

import { CordovaPopupNavigator, UserManager } from 'oidc-client';

import { DomSanitizer } from '@angular/platform-browser';
import Timer = NodeJS.Timer;
import { FormControl } from '@angular/forms';
import { Store } from '@ngrx/store';
import {
  setGroup,
  storeUser,
  toggleExpertMode,
} from './services/store/store.actions';
import {
  AUTHENTICATED,
  EXPERT_MODE,
  HTTP_CALL_IS_LOADING,
  ROLE_IN_CURRENT_WORKSPACE,
  USER,
  USER_GROUPS,
  _SELECTED_GROUP_ID,
  _SELECTED_SERVICE_NAME,
} from './services/store/store.selectors';
import {
  distinctUntilChanged,
  distinctUntilKeyChanged,
  filter,
  map,
  take,
  timeout,
} from 'rxjs/operators';

import { Observable, Subscription } from 'rxjs';
import { MatSidenav } from '@angular/material/sidenav';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatIconRegistry } from '@angular/material/icon';
import { User } from './models/user.model';
import { GroupInformation } from './models/community.model';
import { LanguageService } from './services/language.service';
import { MatDialog } from '@angular/material/dialog';
import { AddCommunityDialogComponent } from './shared/dialogs/add-community-dialog/add-community-dialog.component';
import { StoreState } from './models/state.model';
import { WorkspaceService } from './services/workspace.service';
import { Las2peerService } from './services/las2peer.service';
import { Router } from '@angular/router';

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
  static userManager = new UserManager({});

  @ViewChild(MatSidenav)
  public sidenav: MatSidenav;
  @ViewChild('statusbar') l2pStatusbar: ElementRef;
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

  selectedGroupId: string; // used to show the selected group in the form field
  group = new FormControl();

  noobInfo: boolean;
  version = environment.version;

  isLoading: boolean;
  private silentSigninIntervalHandle: Timer;

  constructor(
    public languageService: LanguageService, // public so that we can access it in the template
    private changeDetectorRef: ChangeDetectorRef,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer,
    private ngrxStore: Store,
    private router: Router,
  ) {
    this.matIconRegistry.addSvgIcon(
      'reqbaz-logo',
      this.domSanitizer.bypassSecurityTrustResourceUrl(
        'assets/icons/reqbaz-logo.svg',
      ),
    );
    this.mobileQuery = window.matchMedia('(max-width: 1000px)');
    this.mobileQueryListener = () =>
      this.changeDetectorRef.detectChanges();
    this.mobileQuery.addEventListener(
      'change',
      this.mobileQueryListener,
      false,
    );

    const noob = localStorage.getItem('notNewbie');
    this.noobInfo = noob == null;
  }

  ngOnInit(): void {
    this.silentSignin();

    let sub = this.ngrxStore
      .select(_SELECTED_GROUP_ID)
      .subscribe((id) => {
        if (!id) return;
        this.selectedGroupId = id;
        this.group.setValue(id);
      });
    this.subscriptions$.push(sub);

    sub = this.loading$.subscribe((loading) => {
      this.isLoading = loading;
      this.changeDetectorRef.detectChanges();
    });
    this.subscriptions$.push(sub);

    sub = this.ngrxStore
      .select(AUTHENTICATED)
      .pipe(distinctUntilChanged())
      .subscribe((auth) => {
        if (!auth) this.l2pStatusbar.nativeElement.handleLogout();
      });
    this.subscriptions$.push(sub);

    if (!environment.production) {
      this.title = `MobSOS Evaluation Center v${environment.version} (dev)`;
      this.snackBar.open(
        'You are currently in the development network. Please note that some features might not be available / fully functional yet',
        'OK',
        { duration: 10000 },
      );
      // Logging the state in dev mode
      sub = this.ngrxStore
        .pipe(map((store: StoreState) => store.Reducer))
        .subscribe((state) => {
          console.log(state);
        });
      this.subscriptions$.push(sub);
    } else {
      this.title = `MobSOS Evaluation Center v${environment.version}`;
    }
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
    if (user?.profile?.preferred_username) {
      this.ngrxStore.dispatch(storeUser({ user }));
    }

    clearInterval(this.silentSigninIntervalHandle);
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

  dismissNoobInfo(remember = false) {
    this.noobInfo = false;
    if (remember) {
      localStorage.setItem('notNewbie', 'true');
    }
  }

  logout() {
    this.setUser(null);
    void this.router.navigate(['/welcome']);
  }

  silentSignin(
    user$: Observable<User> = this.ngrxStore.select(USER),
  ) {
    const silentLoginFunc = () =>
      AppComponent.userManager
        .signinSilentCallback()
        .then(() => {})
        .catch(() => {
          this.setUser(null);
          console.error('Silent login failed');
        });
    void silentLoginFunc();

    const sub = user$
      .pipe(
        filter((u) => !!u?.signedIn),
        distinctUntilKeyChanged('signedIn'),
      )
      .subscribe((user) => {
        // callback only called when signedIn state changes
        clearInterval(this.silentSigninIntervalHandle); // clear old interval
        if (user?.signedIn) {
          // if signed in, create a new interval
          this.silentSigninIntervalHandle = setInterval(
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            silentLoginFunc,
            environment.openIdSilentLoginInterval * 1000,
          );
        }
      });
    this.subscriptions$.push(sub);
  }
}
