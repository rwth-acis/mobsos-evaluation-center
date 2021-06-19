import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { User } from '../models/user.model';
import {
  joinAsSpectator,
  joinAsVisitor,
} from '../services/store.actions';
import { USER } from '../services/store.selectors';
/**
 * Used to join the workspace of another user by url. Url should be of the following format: /join/:groupId/:serviceName/:username
 */
@Component({
  selector: 'app-join-work-space',
  templateUrl: './join-work-space.component.html',
  styleUrls: ['./join-work-space.component.scss'],
})
export class JoinWorkSpaceComponent implements OnInit, OnDestroy {
  constructor(
    private route: ActivatedRoute,
    private ngrxStore: Store,
    private router: Router,
  ) {}
  groupId$: Observable<string>;
  serviceName$: Observable<string>;
  subscription$: Subscription;

  ngOnInit(): void {
    this.subscription$ = this.route.params
      .pipe(withLatestFrom(this.ngrxStore.select(USER)))
      .subscribe(
        ([params, user]: [
          {
            groupId: string;
            serviceName: string;
            username: string;
          },
          User,
        ]) => {
          if (this.router.url.includes('oidc-silent')) {
            return;
          }
          if (!user?.signedIn) {
            this.ngrxStore.dispatch(
              joinAsVisitor({
                groupId: params.groupId,
                serviceName: params.serviceName,
                owner: params.username,
              }),
            );
            this.router.navigateByUrl('/visitor');
          } else {
            this.ngrxStore.dispatch(
              joinAsSpectator({
                groupId: params.groupId,
                serviceName: params.serviceName,
                owner: params.username,
                username: user.profile.preferred_username,
              }),
            );
            this.router.navigateByUrl('/');
          }
        },
      );
  }

  ngOnDestroy() {
    this.subscription$.unsubscribe();
  }
}
