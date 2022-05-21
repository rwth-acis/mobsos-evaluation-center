import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { UserManager } from 'oidc-client';
import { storeUser } from 'src/app/services/store/store.actions';
import { userManagerSettings } from '../oidc-signin/user.manager.settings';

@Component({
  selector: 'app-oidc-silent',
  templateUrl: './oidc-silent.component.html',
  styleUrls: ['./oidc-silent.component.scss'],
})
export class OidcSilentComponent {
  constructor(private router: Router, private ngrxStore: Store) {
    void new UserManager(userManagerSettings)
      .signinSilentCallback()
      .catch((err) => {
        console.error(err);
        this.ngrxStore.dispatch(storeUser({ user: null }));
        void this.router.navigate(['/']);
      });
  }
}
