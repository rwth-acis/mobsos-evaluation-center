import { Component } from '@angular/core';
import { UserManager } from 'oidc-client';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { storeUser } from 'src/app/services/store/store.actions';
import { User } from 'src/app/models/user.model';
import { userManagerSettings } from './user.manager.settings';

@Component({
  selector: 'app-oidc-signin',
  templateUrl: './oidc-signin.component.html',
  styleUrls: ['./oidc-signin.component.scss'],
})
export class OidcSigninComponent {
  constructor(private router: Router, private ngrxStore: Store) {
    void new UserManager(userManagerSettings)
      .signinRedirectCallback()
      .then((user) => {
        if (user?.profile?.preferred_username) {
          this.ngrxStore.dispatch(storeUser({ user: user as User }));
        }
        void this.router.navigateByUrl('/');
      })
      .catch((err) => {
        console.error(err);
        void this.router.navigateByUrl('/');
      });
  }
}
