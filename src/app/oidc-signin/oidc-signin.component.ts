import {Component, OnInit} from '@angular/core';
import {UserManager} from 'oidc-client';
import {StoreService} from '../store.service';
import {Router} from '@angular/router';

@Component({
  selector: 'app-oidc-signin',
  templateUrl: './oidc-signin.component.html',
  styleUrls: ['./oidc-signin.component.scss']
})
export class OidcSigninComponent implements OnInit {

  constructor(private store: StoreService, private router: Router) {
    new UserManager({}).signinRedirectCallback().then(user => {
      this.store.setUser(user);
      this.router.navigate(['/']);
    });
  }

  ngOnInit() {
  }

}
