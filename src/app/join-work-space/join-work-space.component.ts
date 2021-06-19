import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { User } from '../models/user.model';
import { PickUsernameDialogComponent } from '../pick-username-dialog/pick-username-dialog.component';
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
    private dialog: MatDialog,
  ) {}
  groupId$: Observable<string>;
  serviceName$: Observable<string>;
  subscription$: Subscription;

  ngOnInit() {
    this.subscription$ = this.route.params
      .pipe(withLatestFrom(this.ngrxStore.select(USER)))
      .subscribe(
        async ([params, user]: [
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
            const name = await this.openDialog();
            console.log(name);
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
