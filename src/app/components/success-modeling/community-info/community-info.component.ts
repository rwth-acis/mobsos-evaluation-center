import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar';
import { Store } from '@ngrx/store';
import {
  catchError,
  firstValueFrom,
  map,
  of,
  Subscription,
  take,
  timeout,
} from 'rxjs';
import { Las2peerService } from 'src/app/services/las2peer.service';
import {
  addUserToGroup,
  failureResponse,
  fetchGroupMembers,
  removeMemberFromGroup,
} from 'src/app/services/store/store.actions';
import { StateEffects } from 'src/app/services/store/store.effects';
import {
  SELECTED_GROUP,
  SELECTED_GROUP_MEMBERS,
} from 'src/app/services/store/store.selectors';

@Component({
  selector: 'app-community-info',
  templateUrl: './community-info.component.html',
  styleUrls: ['./community-info.component.scss'],
})
export class CommunityInfoComponent implements OnInit, OnDestroy {
  addGroupMemberError: string;
  members$ = this.ngrxStore.select(SELECTED_GROUP_MEMBERS);
  communityName$ = this.ngrxStore
    .select(SELECTED_GROUP)
    .pipe(map((community) => community?.name));
  user: string;

  subscriptions$: Subscription[] = [];

  constructor(
    private ngrxStore: Store,
    private las2peer: Las2peerService,
    private actionState: StateEffects,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.ngrxStore.dispatch(fetchGroupMembers({}));
  }

  async lookupUser(username: string) {
    this.user = undefined;
    this.addGroupMemberError = undefined;
    if (!(username?.length > 0)) {
      return;
    }
    const members = await firstValueFrom(this.members$.pipe(take(1)));
    if (members.some((member) => member.name === username)) {
      this.addGroupMemberError = 'User is already part of this group';
      this.user = undefined;
      return;
    }
    this.user = null;
    const response = await this.las2peer
      .lookupUser(username)
      .catch((err) => {
        console.error(err);
        return err;
      });
    if (response.status === 200) {
      this.user = username;
    } else if (response.status === 400) {
      this.addGroupMemberError = response.error;
      this.user = undefined;
    }
  }

  async addUserToGroup() {
    if (!this.user) return;
    this.ngrxStore.dispatch(addUserToGroup({ username: this.user }));

    const result = await firstValueFrom(
      this.actionState.addUserToGroup$.pipe(take(1)),
    );
    this.user = undefined;
    if ('group' in result) {
    } else {
      this.addGroupMemberError = `An error occured: ${
        result.reason.error as string
      }`;
    }
  }

  async removeMember(username: string) {
    this.ngrxStore.dispatch(removeMemberFromGroup({ username }));

    const result = await firstValueFrom(
      this.actionState.removeMemberFromGroup$.pipe(take(1)),
    );

    this.user = undefined;
    if (!('group' in result)) {
      this.snackBar.open(
        `An error occured: ${result.reason.error as string}`,
        'Ok',
        {
          duration: 2000,
        },
      );
    }
  }

  ngOnDestroy() {
    this.subscriptions$.forEach((sub) => sub.unsubscribe());
  }
}
