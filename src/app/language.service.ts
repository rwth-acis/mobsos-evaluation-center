import {Injectable} from '@angular/core';
import {NGXLogger} from 'ngx-logger';
import {TranslateService} from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  SUPPORTED_LANGUAGES = ['en', 'de'];
  LOCAL_STORAGE_LANGUAGE = 'language';

  private currentLanguage = 'en';

  constructor(private logger: NGXLogger, private translate: TranslateService) {
    this.currentLanguage = this.getInitialLanguage();
    this.translate.use(this.currentLanguage);
  }

  /**
   * Determine initial language with the following precedence:
   *
   * 1. language cookie
   * 2. english
   */
  getInitialLanguage() {
    let selectedLanguage = 'en';
    const localStorageLang = localStorage.getItem((this.LOCAL_STORAGE_LANGUAGE));
    if (localStorageLang && this.SUPPORTED_LANGUAGES.includes(localStorageLang)) {
      selectedLanguage = localStorageLang;
      this.logger.debug('Stored language: ' + localStorageLang);
    }
    return selectedLanguage;
  }

  changeLanguage(language: string) {
    this.currentLanguage = language;
    this.translate.use(language);
    localStorage.setItem(this.LOCAL_STORAGE_LANGUAGE, language);
  }

  getCurrentLanguage() {
    return this.currentLanguage;
  }
}
