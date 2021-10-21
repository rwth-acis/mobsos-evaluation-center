import { Component, OnInit } from '@angular/core';
import { UserManager } from 'oidc-client';

@Component({
  selector: 'app-oidc-silent',
  templateUrl: './oidc-silent.component.html',
  styleUrls: ['./oidc-silent.component.scss'],
})
export class OidcSilentComponent implements OnInit {
  constructor() {
    void new UserManager({}).signinSilentCallback();
  }

  ngOnInit() {}
}
