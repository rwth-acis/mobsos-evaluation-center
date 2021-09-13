import { Component, OnInit } from '@angular/core';
import { UserManager } from 'oidc-client';
import { Router } from '@angular/router';
import { User } from '../../models/user.model';
import { Store } from '@ngrx/store';
import { storeUser } from '../../services/store.actions';

@Component({
  selector: 'app-oidc-signout',
  templateUrl: './oidc-signout.component.html',
  styleUrls: ['./oidc-signout.component.scss'],
})
export class OidcSignoutComponent implements OnInit {
  constructor(private ngrxStore: Store, private router: Router) {
    void new UserManager({})
      .signoutRedirectCallback()
      .then((user) => {
        this.ngrxStore.dispatch(
          storeUser({ user: user as unknown as User }),
        );
        void this.router.navigate(['/']);
      });
  }

  ngOnInit(): void {}
}
