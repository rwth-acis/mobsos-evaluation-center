import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import {
  catchError,
  combineLatest,
  filter,
  first,
  firstValueFrom,
  map,
  of,
  Subscription,
  switchMap,
  take,
  timeout,
} from 'rxjs';
import { User } from 'src/app/models/user.model';
// eslint-disable-next-line max-len
import {
  IS_MEMBER_OF_SELECTED_GROUP,
  MEASURE_CATALOG,
  MEASURE_CATALOG_FROM_WORKSPACE,
  MODEL_AND_CATALOG_LOADED,
  SELECTED_GROUP,
  SUCCESS_MODEL,
  SUCCESS_MODEL_FROM_WORKSPACE,
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
  selectedGroup$ = this.ngrxStore.select(SELECTED_GROUP);
  memberOfGroup$ = this.ngrxStore.select(IS_MEMBER_OF_SELECTED_GROUP);
  user$ = this.ngrxStore.select(USER);
  applicationWorkspaceOwner$ = this.ngrxStore.select(WORKSPACE_OWNER);

  successModel$ = this.ngrxStore.select(SUCCESS_MODEL_FROM_WORKSPACE);
  measureCatalog$ = this.ngrxStore.select(
    MEASURE_CATALOG_FROM_WORKSPACE,
  );
  assetsLoaded$ = combineLatest([
    this.successModel$,
    this.measureCatalog$,
  ]).pipe(map(([model, catalog]) => !!model && !!catalog));
  showSuccessModelEmpty$ = this.successModel$.pipe(
    map(
      (model) =>
        !Object.values(model.dimensions)?.some(
          (dimension) => dimension.length > 0,
        ),
    ),
  );

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
