import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { map } from 'rxjs';
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
  constructor(private ngrxStore: Store) {}

  ngOnInit(): void {
    this.ngrxStore.dispatch(fetchGroupMembers({}));
  }
}
