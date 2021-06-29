import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { UserManager } from 'oidc-client';
import { Observable, Subscription } from 'rxjs';
import {
  distinctUntilChanged,
  distinctUntilKeyChanged,
  filter,
  withLatestFrom,
} from 'rxjs/operators';
import { User, UserRole } from '../models/user.model';
import { PickUsernameDialogComponent } from '../pick-username-dialog/pick-username-dialog.component';
import {
  joinWorkSpace,
  setCommunityWorkspaceOwner,
  setGroup,
  setServiceName,
  setUserName,
} from '../services/store.actions';
import { _USER } from '../services/store.selectors';

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
    private dialog: MatDialog,
  ) {}
  user$ = this.ngrxStore.select(_USER);
  groupId$: Observable<string>;
  serviceName$: Observable<string>;
  subscription$: Subscription;
  subscriptions$: Subscription[] = [];
  owner: string;
  serviceName: string;
  groupId: string;
  username: string;
  user: User;
  private userManager = new UserManager({});

  ngOnInit() {
    this.userManager.createSigninRequest();
    let sub = this.route.params
      .pipe(withLatestFrom(this.user$))
      .subscribe(
        async ([params, user]: [
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
            this.router.navigateByUrl('/');
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
            this.router.navigateByUrl('/visitor');
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
          this.router.navigateByUrl('');
        }
      });
  }

  joinWorkspace() {
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

    this.router.navigateByUrl('/visitor');
  }

  openDialog(): Promise<any> {
    const dialogRef = this.dialog.open(PickUsernameDialogComponent, {
      width: '250px',
      data: { name: undefined },
      disableClose: true,
      minWidth: 300,
    });

    return dialogRef.afterClosed().toPromise();
  }

  ngOnDestroy() {
    this.subscriptions$.forEach((subscription) =>
      subscription.unsubscribe(),
    );
  }
}
