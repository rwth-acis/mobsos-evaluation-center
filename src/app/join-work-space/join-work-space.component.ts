import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { props, Store } from '@ngrx/store';
import { UserManager } from 'oidc-client';
import { Observable, Subscription } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { User, UserRole } from '../models/user.model';
import { PickUsernameDialogComponent } from '../pick-username-dialog/pick-username-dialog.component';
import {
  joinWorkSpace,
  setCommunityWorkspaceOwner,
  setGroup,
  setService,
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
  groupId$: Observable<string>;
  serviceName$: Observable<string>;
  subscription$: Subscription;
  owner: string;
  serviceName: string;
  groupId: string;
  username: string;
  user: User;
  private userManager = new UserManager({});

  ngOnInit() {
    this.userManager.signinCallback();
    this.subscription$ = this.route.params
      .pipe(withLatestFrom(this.ngrxStore.select(_USER)))
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
          localStorage.setItem('invite-link', this.router.url);
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
            if (!cachedName) {
              return;
            }
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
    localStorage.setItem('visitor-username', this.username);
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
    this.subscription$.unsubscribe();
  }
}
