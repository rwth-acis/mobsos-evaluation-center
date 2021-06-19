import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { map, withLatestFrom } from 'rxjs/operators';
import {
  ASSETS_LOADED,
  DIMENSIONS_IN_MODEL,
  MEASURE_CATALOG,
  SELECTED_GROUP_ID,
  SELECTED_SERVICE_NAME,
  SUCCESS_MODEL,
} from '../services/store.selectors';
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
  showSuccessModelEmpty$ = this.ngrxStore
    .select(DIMENSIONS_IN_MODEL)
    .pipe(
      map(
        (dimensions) =>
          dimensions.find((dimension) => dimension.length > 0) ===
          undefined,
      ),
    );
  successMode$ = this.ngrxStore.select(SUCCESS_MODEL);
  measureCatalog$ = this.ngrxStore.select(MEASURE_CATALOG);

  translationMap = translationMap; // maps dimensions to their translation keys
  iconMap = iconMap; // maps dimensions to their icons

  constructor(private ngrxStore: Store) {}

  ngOnInit(): void {}
}
