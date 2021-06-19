import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { filter, map, withLatestFrom } from 'rxjs/operators';
import {
  APPLICATION_WORKSPACE,
  ASSETS_LOADED,
  DIMENSIONS_IN_MODEL,
  MEASURE_CATALOG,
  SELECTED_GROUP_ID,
  SELECTED_SERVICE_NAME,
  SUCCESS_MODEL,
} from '../services/store.selectors';
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
  applicationWorkspaceOwner$ = this.ngrxStore
    .select(APPLICATION_WORKSPACE)
    .pipe(map((workspace) => workspace?.createdBy));
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

  constructor(
    private ngrxStore: Store,
    private workspaceService: WorkspaceService,
  ) {}

  ngOnInit(): void {
    this.selectedGroupId$
      .pipe(filter((id) => !!id))
      .subscribe((selectedGroupId) => {
        console.log(selectedGroupId);
        this.workspaceService.startSynchronizingWorkspace(
          selectedGroupId,
        );
      });
  }
}
