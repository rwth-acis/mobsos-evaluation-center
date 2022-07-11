import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { joinAbsoluteUrlPath } from 'src/app/services/las2peer.service';
import { AUTHENTICATED } from 'src/app/services/store/store.selectors';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-info',
  templateUrl: './info.component.html',
  styleUrls: ['./info.component.scss'],
})
export class InfoComponent {
  authenticated$ = this.store.select(AUTHENTICATED);
  evalcenterProjectLink = joinAbsoluteUrlPath(
    environment.reqBazFrontendUrl,
    'projects',
    '498',
  );
  constructor(private store: Store) {}
}
