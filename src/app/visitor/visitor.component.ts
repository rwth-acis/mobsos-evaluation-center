import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import {
  delay,
  filter,
  first,
  map,
  throttleTime,
  withLatestFrom,
} from 'rxjs/operators';
import { User, UserRole } from '../models/user.model';
import { joinWorkSpace } from '../services/store.actions';
import {
  APPLICATION_WORKSPACE,
  ASSETS_LOADED,
  COMMUNITY_WORKSPACE,
  DIMENSIONS_IN_MODEL,
  EDIT_MODE,
  MEASURE_CATALOG,
  RESTRICTED_MODE,
  ROLE_IN_CURRENT_WORKSPACE,
  SELECTED_GROUP_ID,
  SELECTED_SERVICE_NAME,
  SUCCESS_MODEL,
  USER,
  WORKSPACE_OWNER,
} from '../services/store.selectors';
import { isEmpty } from 'lodash-es';
import { WorkspaceService } from '../services/workspace.service';
import { iconMap, translationMap } from '../success-modeling/config';

@Component({
  selector: 'app-visitor',
  templateUrl: './visitor.component.html',
  styleUrls: ['./visitor.component.scss'],
})
export class VisitorComponent implements OnInit {
  selectedServiceName$ = this.ngrxStore.select(SELECTED_SERVICE_NAME);
  selectedGroupId$ = this.ngrxStore.select(SELECTED_GROUP_ID);
  assetsLoaded$ = this.ngrxStore.select(ASSETS_LOADED);
  user$ = this.ngrxStore.select(USER);
  applicationWorkspaceOwner$ = this.ngrxStore.select(WORKSPACE_OWNER);
  showSuccessModelEmpty$ = this.ngrxStore
    .select(DIMENSIONS_IN_MODEL)
    .pipe(
      filter((dimensions) => !!dimensions),
      map(
        (dimensions) =>
          dimensions.find((dimension) => dimension.length > 0) ===
          undefined,
      ),
    );
  successModel$ = this.ngrxStore.select(SUCCESS_MODEL);
  measureCatalog$ = this.ngrxStore.select(MEASURE_CATALOG);
  dimensions = Object.keys(translationMap);
  translationMap = translationMap; // maps dimensions to their translation keys
  iconMap = iconMap; // maps dimensions to their icons
  selectedServiceName: string;
  workspaceOwner: string;
  user: User;
  constructor(private ngrxStore: Store, private router: Router) {}

  ngOnInit(): void {
    if (!localStorage.getItem('visitor-username')) {
      this.router.navigate(['/']);
    }
  }
}
