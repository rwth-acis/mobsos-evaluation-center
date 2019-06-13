import {Component, OnInit} from '@angular/core';
import {UserManager} from 'oidc-client';
import {Router} from '@angular/router';
import {StoreService} from '../store.service';

@Component({
  selector: 'app-oidc-signout',
  templateUrl: './oidc-signout.component.html',
  styleUrls: ['./oidc-signout.component.scss']
})
export class OidcSignoutComponent implements OnInit {

  constructor(private store: StoreService, private router: Router) {
    new UserManager({}).signoutRedirectCallback().then(user => {
      this.store.setUser(user);
      this.router.navigate(['/']);
    });
  }

  ngOnInit() {
  }

}
