import {ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import 'oidc-client';
import 'las2peer-frontend-statusbar/las2peer-frontend-statusbar.js';
import {MediaMatcher} from '@angular/cdk/layout';
import {environment} from '../environments/environment';
import {NGXLogger} from 'ngx-logger';
import {LanguageService} from './language.service';
import {StoreService} from './store.service';
import {CordovaPopupNavigator, UserManager} from 'oidc-client';

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
  title = 'MobSOS Evaluation Center';
  mobileQuery: MediaQueryList;
  mobileQueryListener: () => void;
  environment = environment;
  LOCAL_STORAGE_EXPERT_MODE = 'expert-mode';
  expertMode = false;

  constructor(private logger: NGXLogger, public languageService: LanguageService, private store: StoreService,
              changeDetectorRef: ChangeDetectorRef, media: MediaMatcher) {
    this.mobileQuery = media.matchMedia('(max-width: 600px)');
    this.mobileQueryListener = () => changeDetectorRef.detectChanges();
    this.mobileQuery.addListener(this.mobileQueryListener);
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

  ngOnInit(): void {
    this.expertMode = !!localStorage.getItem(this.LOCAL_STORAGE_EXPERT_MODE);
  }

}
