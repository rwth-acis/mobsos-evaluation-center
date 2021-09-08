import { Component, OnInit } from '@angular/core';
import { UserManager } from 'oidc-client';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { storeUser } from '../../services/store.actions';
import { User as UserInfo } from '../../models/user.model';

@Component({
  selector: 'app-oidc-signin',
  templateUrl: './oidc-signin.component.html',
  styleUrls: ['./oidc-signin.component.scss'],
})
export class OidcSigninComponent implements OnInit {
  constructor(private router: Router, private ngrxStore: Store) {
    void new UserManager({}).signinRedirectCallback().then((user) => {
      this.ngrxStore.dispatch(storeUser({ user: user as UserInfo }));
      void this.router.navigateByUrl('/');
    });
  }

  ngOnInit(): void {}
}
