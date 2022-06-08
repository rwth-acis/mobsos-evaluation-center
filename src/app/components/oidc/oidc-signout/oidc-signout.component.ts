import { Component } from '@angular/core';
import { UserManager } from 'oidc-client';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { storeUser } from 'src/app/services/store/store.actions';
import { User } from 'src/app/models/user.model';
import { userManagerSettings } from '../oidc-signin/user.manager.settings';

@Component({
  selector: 'app-oidc-signout',
  templateUrl: './oidc-signout.component.html',
  styleUrls: ['./oidc-signout.component.scss'],
})
export class OidcSignoutComponent {
  constructor(private ngrxStore: Store, private router: Router) {
    void new UserManager(userManagerSettings)
      .signoutRedirectCallback()
      .then(() => {
        this.ngrxStore.dispatch(storeUser({ user: null }));
        void this.router.navigate(['/']);
      })
      .catch((err) => {
        console.error(err);
        void this.router.navigate(['/']);
      });
  }
}
