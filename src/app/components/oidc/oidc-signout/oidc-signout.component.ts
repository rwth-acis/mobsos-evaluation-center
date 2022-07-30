import { Component } from '@angular/core';
import { UserManager } from 'oidc-client';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { storeUser } from 'src/app/services/store/store.actions';
import { User } from 'src/app/models/user.model';
import { userManagerSettings } from '../oidc-signin/user.manager.settings';
import { OAuthService } from 'angular-oauth2-oidc';

@Component({
  selector: 'app-oidc-signout',
  templateUrl: './oidc-signout.component.html',
  styleUrls: ['./oidc-signout.component.scss'],
})
export class OidcSignoutComponent {
  constructor(private oauthService: OAuthService) {
    this.oauthService.logOut();
  }
}
