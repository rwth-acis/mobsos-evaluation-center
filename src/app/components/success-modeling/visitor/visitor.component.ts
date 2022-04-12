import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import {
  catchError,
  filter,
  first,
  firstValueFrom,
  of,
  Subscription,
  switchMap,
  take,
  timeout,
} from 'rxjs';
import { User } from 'src/app/models/user.model';
// eslint-disable-next-line max-len
import {
  MEASURE_CATALOG,
  MODEL_AND_CATALOG_LOADED,
  SUCCESS_MODEL,
  SUCCESS_MODEL_IS_EMPTY,
  USER,
  WORKSPACE_OWNER,
  _SELECTED_GROUP_ID,
  _SELECTED_SERVICE_NAME,
} from 'src/app/services/store/store.selectors';
import { iconMap, translationMap } from '../config';

@Component({
  selector: 'app-visitor',
  templateUrl: './visitor.component.html',
  styleUrls: ['./visitor.component.scss'],
})
export class VisitorComponent implements OnInit, OnDestroy {
  selectedServiceName$ = this.ngrxStore.select(
    _SELECTED_SERVICE_NAME,
  );
  selectedGroupId$ = this.ngrxStore.select(_SELECTED_GROUP_ID);
  assetsLoaded$ = this.ngrxStore.select(MODEL_AND_CATALOG_LOADED);
  user$ = this.ngrxStore.select(USER);
  applicationWorkspaceOwner$ = this.ngrxStore.select(WORKSPACE_OWNER);
  showSuccessModelEmpty$ = this.ngrxStore.select(
    SUCCESS_MODEL_IS_EMPTY,
  );

  successModel$ = this.ngrxStore.select(SUCCESS_MODEL);
  measureCatalog$ = this.ngrxStore.select(MEASURE_CATALOG);
  dimensions = Object.keys(translationMap);
  translationMap = translationMap; // maps dimensions to their translation keys
  iconMap = iconMap; // maps dimensions to their icons
  selectedServiceName: string;
  workspaceOwner: string;
  user: User;

  subscriptions$: Subscription[] = [];
  constructor(private ngrxStore: Store, private router: Router) {}

  async ngOnInit() {
    const owner = await firstValueFrom(
      this.applicationWorkspaceOwner$.pipe(
        timeout(3000),
        filter((o) => !!o),
        catchError((err) => of(err)),
        take(1),
      ),
    );

    if (owner instanceof Error) {
      let link = localStorage.getItem('invite-link'); // if an invite link was cached, we rejoin that workspace
      if (!link) {
        link = '/';
      }
      void this.router.navigateByUrl(link);
      return;
    }

    this.workspaceOwner = owner;
  }

  ngOnDestroy(): void {
    this.subscriptions$.forEach((sub) => sub.unsubscribe());
  }
}
