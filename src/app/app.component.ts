import {ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import 'oidc-client';
import 'las2peer-frontend-statusbar/las2peer-frontend-statusbar.js';
import {MediaMatcher} from '@angular/cdk/layout';
import {environment} from '../environments/environment';
import {NGXLogger} from 'ngx-logger';
import {LanguageService} from './language.service';
import {GroupInformation, StoreService} from './store.service';
import {CordovaPopupNavigator, UserManager} from 'oidc-client';
import {MatSidenav} from "@angular/material";
import * as Hammer from 'hammerjs';

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
  styleUrls: ['./app.component.scss']
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
  user;
  signedIn = false;

  constructor(private logger: NGXLogger, public languageService: LanguageService, private store: StoreService,
              changeDetectorRef: ChangeDetectorRef, media: MediaMatcher, private elementRef: ElementRef) {
    this.mobileQuery = media.matchMedia('(max-width: 600px)');
    this.mobileQueryListener = () => changeDetectorRef.detectChanges();
    this.mobileQuery.addListener(this.mobileQueryListener);
  }

  static objectFlip(obj) {
    const ret = {};
    Object.keys(obj).forEach((key) => {
      ret[obj[key]] = key;
    });
    return ret;
  }

  ngOnDestroy(): void {
    this.mobileQuery.removeListener(this.mobileQueryListener);
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
    this.store.setUser(user);
  }

  onGroupSelected(group) {
    this.store.setGroup(group);
  }

  menuItemClicked() {
    if (this.mobileQuery.matches) {
      this.sidenav.toggle();
    }
  }

  ngOnInit(): void {
    // swipe navigation
    const hammertime = new Hammer(this.elementRef.nativeElement, {});
    hammertime.on('panright', (ev) => {
      if (this.mobileQuery.matches) {
        this.sidenav.open();
      }
    });
    hammertime.on('panleft', (ev) => {
      if (this.mobileQuery.matches) {
        this.sidenav.close();
      }
    });
    this.expertMode = !!localStorage.getItem(this.LOCAL_STORAGE_EXPERT_MODE);
    this.store.startPolling();
    this.store.groups.subscribe((groups) => {
      const allGroups = Object.values(groups);
      this.myGroups = allGroups.filter(group => group.member).sort();
      this.otherGroups = allGroups.filter(group => !group.member).sort();
      this.groupMap = groups;
    });
    this.store.selectedGroup.subscribe(selectedGroup => this.selectedGroup = selectedGroup);
    this.store.user.subscribe(user => {
      this.user = user;
      this.signedIn = !!user;
    });
  }

}
