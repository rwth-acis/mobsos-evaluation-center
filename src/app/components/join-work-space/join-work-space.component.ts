import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { UserManager } from 'oidc-client';
import { Observable, Subscription } from 'rxjs';
import {
  distinctUntilKeyChanged,
  filter,
  withLatestFrom,
} from 'rxjs/operators';
import { User } from '../../models/user.model';
import { UserRole } from '../../models/workspace.model';

import {
  joinWorkSpace,
  setCommunityWorkspaceOwner,
  setGroup,
  setServiceName,
  setUserName,
} from '../../services/store/store.actions';
import { USER } from '../../services/store/store.selectors';

/**
 * Used to join the workspace of another user by url. Url should be of the following format: /join/:groupId/:serviceName/:username
 */
@Component({
  selector: 'app-join-work-space',
  templateUrl: './join-work-space.component.html',
  styleUrls: ['./join-work-space.component.scss'],
})
export class JoinWorkSpaceComponent implements OnInit, OnDestroy {
  user$ = this.ngrxStore.select(USER);
  groupId$: Observable<string>;
  serviceName$: Observable<string>;

  subscriptions$: Subscription[] = [];
  owner: string;
  serviceName: string;
  groupId: string;
  username: string;
  user: User;
  private userManager = new UserManager({});

  constructor(
    private route: ActivatedRoute,
    private ngrxStore: Store,
    private router: Router,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    let sub = this.route.params
      .pipe(withLatestFrom(this.user$))
      .subscribe(
        ([params, user]: [
          {
            groupId: string;
            serviceName: string;
            username: string;
          },
          User,
        ]) => {
          if (this.router.url.includes('oidc')) {
            return; // oidc client might be redirecting while this component is active
          }
          this.ngrxStore.dispatch(
            setGroup({ groupId: params.groupId }),
          );
          this.ngrxStore.dispatch(
            setServiceName({ serviceName: params.serviceName }),
          );
          this.ngrxStore.dispatch(
            setCommunityWorkspaceOwner({ owner: params.username }),
          );
          this.user = user;
          this.owner = params.username;
          this.groupId = params.groupId;
          this.serviceName = params.serviceName;

          if (user?.signedIn) {
            // if we are signed in we join the workspace with our regular username
            this.ngrxStore.dispatch(
              joinWorkSpace({
                groupId: params.groupId,
                serviceName: params.serviceName,
                owner: params.username,
                username: user.profile.preferred_username,
              }),
            );
            void this.router.navigateByUrl('/');
          } else {
            const cachedName = localStorage.getItem(
              'visitor-username',
            );
            const cachedInviteLink =
              localStorage.getItem('invite-link');

            if (
              !cachedName ||
              !cachedInviteLink ||
              !this.router.url.includes(cachedInviteLink)
            ) {
              localStorage.setItem('invite-link', this.router.url);
              return;
            }
            // if we had joined this workspace before we use the same username
            this.ngrxStore.dispatch(
              joinWorkSpace({
                groupId: params.groupId,
                serviceName: params.serviceName,
                owner: params.username,
                username: cachedName,
                role: UserRole.LURKER,
              }),
            );
            void this.router.navigateByUrl(
              '/success-modeling/visitor',
            );
          }
        },
      );
    this.subscriptions$.push(sub);
    sub = this.user$
      .pipe(
        filter((user) => !!user),
        distinctUntilKeyChanged('signedIn'),
      )
      .subscribe((user) => {
        if (user?.signedIn) {
          this.ngrxStore.dispatch(
            joinWorkSpace({
              groupId: this.groupId,
              serviceName: this.serviceName,
              owner: this.username,
              username: user.profile.preferred_username,
            }),
          );
          void this.router.navigateByUrl('');
        }
      });
    this.subscriptions$.push(sub);
  }

  joinWorkspace(): void {
    if (!this.username) {
      return;
    }
    this.ngrxStore.dispatch(setUserName({ username: this.username }));

    this.ngrxStore.dispatch(
      joinWorkSpace({
        groupId: this.groupId,
        serviceName: this.serviceName,
        owner: this.owner,
        username: this.username,
        role: UserRole.LURKER,
      }),
    );

    void this.router.navigateByUrl('/success-modeling/visitor');
  }

  ngOnDestroy(): void {
    this.subscriptions$.forEach((subscription) =>
      subscription.unsubscribe(),
    );
  }
}
