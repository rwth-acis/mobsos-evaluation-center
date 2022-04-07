import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { firstValueFrom, map, take } from 'rxjs';
import { Las2peerService } from 'src/app/services/las2peer.service';
import { fetchGroupMembers } from 'src/app/services/store/store.actions';
import {
  SELECTED_GROUP,
  SELECTED_GROUP_MEMBERS,
} from 'src/app/services/store/store.selectors';

@Component({
  selector: 'app-community-info',
  templateUrl: './community-info.component.html',
  styleUrls: ['./community-info.component.scss'],
})
export class CommunityInfoComponent implements OnInit {
  members$ = this.ngrxStore.select(SELECTED_GROUP_MEMBERS);
  communityName$ = this.ngrxStore
    .select(SELECTED_GROUP)
    .pipe(map((community) => community?.name));
  panelOpenState;
  user: string;
  error: string;
  constructor(
    private ngrxStore: Store,
    private las2peer: Las2peerService,
  ) {}

  ngOnInit(): void {
    this.ngrxStore.dispatch(fetchGroupMembers({}));
  }

  async lookupUser(username: string) {
    const members = await firstValueFrom(this.members$.pipe(take(1)));
    if (members.some((member) => member.name === username)) {
      this.error = 'User is already part of this group';
      this.user = undefined;
      return;
    }
    this.user = null;
    const response = await this.las2peer
      .lookupUser(username)
      .catch((err) => {
        console.log(err);
        return err;
      });
    if (response.status === 200) {
      this.user = username;
    } else if (response.status === 400) {
      this.error = response.error;
      this.user = undefined;
    }
  }

  addUserToGroup() {
    if (!this.user) return;
    // this.ngrxStore.dispatch(addUserToGroup({ user: this.user }));
  }
}
