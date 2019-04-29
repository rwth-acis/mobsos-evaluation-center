import {Component, OnInit} from '@angular/core';
import {UserManager} from 'oidc-client';

@Component({
  selector: 'app-oidc-signin',
  templateUrl: './oidc-signin.component.html',
  styleUrls: ['./oidc-signin.component.scss']
})
export class OidcSigninComponent implements OnInit {

  constructor() {
    new UserManager({}).signinPopupCallback();
  }

  ngOnInit() {
  }

}
