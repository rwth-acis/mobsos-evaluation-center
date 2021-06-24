import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { of, Subscription } from 'rxjs';
import {
  catchError,
  delay,
  filter,
  first,
  map,
  takeUntil,
  takeWhile,
  timeout,
} from 'rxjs/operators';
import { User } from '../models/user.model';
import {
  APPLICATION_WORKSPACE,
  MODEL_AND_CATALOG_LOADED,
  _COMMUNITY_WORKSPACE,
  DIMENSIONS_IN_MODEL,
  MEASURE_CATALOG,
  _SELECTED_GROUP_ID,
  SELECTED_SERVICE,
  _SELECTED_SERVICE_NAME,
  SUCCESS_MODEL,
  _USER,
  WORKSPACE_OWNER,
  SUCCESS_MODEL_FROM_NETWORK,
  SUCCESS_MODEL_IS_EMPTY,
} from '../services/store.selectors';
import { iconMap, translationMap } from '../success-modeling/config';

@Component({
  selector: 'app-visitor',
  templateUrl: './visitor.component.html',
  styleUrls: ['./visitor.component.scss'],
})
export class VisitorComponent implements OnInit, OnDestroy {
  linkExpected: boolean = true;
  selectedServiceName$ = this.ngrxStore.select(
    _SELECTED_SERVICE_NAME,
  );
  selectedGroupId$ = this.ngrxStore.select(_SELECTED_GROUP_ID);
  assetsLoaded$ = this.ngrxStore.select(MODEL_AND_CATALOG_LOADED);
  user$ = this.ngrxStore.select(_USER);
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

  ngOnInit(): void {
    let sub = this.applicationWorkspaceOwner$.subscribe((owner) => {
      if (owner) {
        this.linkExpected = false;
      }
    });
    this.subscriptions$.push(sub);

    setTimeout(() => {
      if (this.linkExpected) {
        let link = localStorage.getItem('invite-link');
        if (!link) {
          link = '/';
        }
        this.router.navigateByUrl(link);
      }
    }, 3000);
  }

  ngOnDestroy() {
    this.subscriptions$.forEach((sub) => sub.unsubscribe());
  }
}
