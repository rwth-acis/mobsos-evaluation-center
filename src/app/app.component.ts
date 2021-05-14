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
import { MediaMatcher } from '@angular/cdk/layout';
import { environment } from '../environments/environment';
import { NGXLogger } from 'ngx-logger';
import { LanguageService } from './language.service';
import { GroupInformation, StoreService } from './store.service';
import { CordovaPopupNavigator, UserManager } from 'oidc-client';
import { MatIconRegistry } from '@angular/material/icon';
import { MatSidenav } from '@angular/material/sidenav';
import { MatSnackBar } from '@angular/material/snack-bar';
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
  setGroup,
  storeUser,
} from './services/store.actions';
import {
  HTTP_CALL_IS_LOADING,
  SELECTED_GROUP,
  SELECTED_SERVICE,
} from './services/store.selectors';
import { filter, first } from 'rxjs/operators';

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

  constructor(
    private logger: NGXLogger,
    public languageService: LanguageService,
    private store: StoreService,
    changeDetectorRef: ChangeDetectorRef,
    media: MediaMatcher,
    private elementRef: ElementRef,
    private swUpdate: SwUpdate,
    private snackBar: MatSnackBar,
    private translate: TranslateService,
    private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer,
    private ngrxStore: Store
  ) {
    this.matIconRegistry.addSvgIcon(
      'reqbaz-logo',
      this.domSanitizer.bypassSecurityTrustResourceUrl(
        'assets/icons/reqbaz-logo.svg'
      )
    );
    this.mobileQuery = media.matchMedia('(max-width: 600px)');
    this.mobileQueryListener = () => changeDetectorRef.detectChanges();
    this.mobileQuery.addEventListener(
      'change',
      this.mobileQueryListener,
      false
    );
  }

  ngOnDestroy(): void {
    this.store.stopPolling();
    this.mobileQuery.removeEventListener(
      'change',
      this.mobileQueryListener,
      false
    );
  }

  useLanguage(language: string) {
    this.logger.debug(`Changing language to ${language}`);
    this.languageService.changeLanguage(language);
  }

  setExpertMode(mode) {
    this.expertMode = mode;
    localStorage.setItem(this.LOCAL_STORAGE_EXPERT_MODE, mode);
  }

  setUser(user) {
    this.ngrxStore.dispatch(storeUser({ user }));
    this.store.setUser(user);
  }

  onGroupSelected(groupId: string) {
    this.store.setGroup(groupId);
    this.ngrxStore.dispatch(setGroup({ groupId }));
  }

  menuItemClicked() {
    if (this.mobileQuery.matches) {
      this.sidenav.toggle();
    }
  }

  ngOnInit(): void {
    this.store.startPolling();
    this.ngrxStore.dispatch(fetchServices());
    this.ngrxStore.dispatch(fetchGroups());

    this.ngrxStore
      .select(SELECTED_GROUP)
      .pipe(
        filter((group) => group && group.name === undefined),
        first()
      )
      .subscribe((group) => {
        this.selectedGroupForm.setValue(group.name);
      });
    this.ngrxStore.subscribe((state) => {
      console.log(state);
    });

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
        const snackBarRef = this.snackBar.open(message, reloadAction, null);
        snackBarRef.onAction().subscribe(() => {
          window.location.reload();
        });
      });
    }
    this.expertMode = !!localStorage.getItem(this.LOCAL_STORAGE_EXPERT_MODE);

    this.store.groups.subscribe((groups) => {
      const allGroups = Object.values(groups);
      this.myGroups = allGroups.filter((group) => group.member).sort();
      this.otherGroups = allGroups.filter((group) => !group.member).sort();
      this.groupMap = groups;
    });
    this.store.selectedGroup.subscribe((selectedGroup) => {
      this.selectedGroup = selectedGroup;
      if (selectedGroup) {
        this.selectedGroupForm.setValue(selectedGroup);
      }
    });
    const silentLoginFunc = () => {
      this.userManager
        .signinSilentCallback()
        .then(() => {
          this.logger.debug('Silent login succeeded');
        })
        .catch(() => {
          this.setUser(null);
          this.logger.debug('Silent login failed');
        });
    };
    silentLoginFunc();
    this.store.user.subscribe((user) => {
      this.user = user;
      this.signedIn = !!user;
      clearInterval(this.silentSigninIntervalHandle);
      if (this.signedIn) {
        this.silentSigninIntervalHandle = setInterval(
          silentLoginFunc,
          environment.openIdSilentLoginInterval * 1000
        );
      }
    });
  }
}
