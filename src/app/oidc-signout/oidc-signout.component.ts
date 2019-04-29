import {Component, OnInit} from '@angular/core';
import {UserManager} from 'oidc-client';

@Component({
  selector: 'app-oidc-signout',
  templateUrl: './oidc-signout.component.html',
  styleUrls: ['./oidc-signout.component.scss']
})
export class OidcSignoutComponent implements OnInit {

  constructor() {
    new UserManager({}).signoutPopupCallback();
  }

  ngOnInit() {
  }

}
