import { Component, OnDestroy, OnInit } from '@angular/core';

import vkbeautify from 'vkbeautify';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { Store } from '@ngrx/store';

import {
  catchError,
  distinctUntilChanged,
  filter,
  first,
  map,
  timeout,
} from 'rxjs/operators';
import { combineLatest, of, Subscription } from 'rxjs';
import { ServiceInformation } from 'src/app/models/service.model';
import {
  disableEdit,
  setService,
  saveCatalog,
  failureResponse,
  HttpActions,
  saveModel,
} from 'src/app/services/store/store.actions';
import { StateEffects } from 'src/app/services/store/store.effects';
import {
  MEASURE_CATALOG,
  SUCCESS_MODEL,
  _SELECTED_GROUP_ID,
  SELECTED_SERVICE,
  _SERVICES,
  SUCCESS_MODEL_XML,
  MEASURE_CATALOG_XML,
} from 'src/app/services/store/store.selectors';

@Component({
  selector: 'app-raw-edit',
  templateUrl: './raw-edit.component.html',
  styleUrls: ['./raw-edit.component.scss'],
})
export class RawEditComponent implements OnInit, OnDestroy {
  groupID: string;
  services = [];
  serviceMap = {};
  selectedServiceName: string;

  editorOptions = {
    theme: 'vs',
    language: 'xml',
    automaticLayout: true,
  };
  measureCatalogXml: string;
  measureCatalog$ = this.ngrxStore.select(MEASURE_CATALOG);
  successModelXml: string;
  successModel$ = this.ngrxStore.select(SUCCESS_MODEL);
  saveInProgress = false;
  selectedGroupId$ = this.ngrxStore.select(_SELECTED_GROUP_ID);
  selectedService$ = this.ngrxStore.select(SELECTED_SERVICE);
  measureCatalogInitialized$ = this.ngrxStore
    .select(MEASURE_CATALOG)
    .pipe(
      filter((catalog) => catalog !== undefined),
      first(),
    );
  successModelInitialized$ = this.ngrxStore
    .select(SUCCESS_MODEL)
    .pipe(
      filter((model) => model !== undefined),
      first(),
    );
  services$ = this.ngrxStore.select(_SERVICES);

  canSaveSuccessModel$ = combineLatest([
    this.selectedGroupId$,
    this.selectedService$,
  ]).pipe(map(([groupid, service]) => !!groupid && !!service));

  canSaveMeasureCatalog$ = this.selectedGroupId$.pipe(
    map((groupid) => !!groupid && !this.saveInProgress),
  );

  subscriptions$: Subscription[] = [];
  constructor(
    private snackBar: MatSnackBar,
    private translate: TranslateService,
    private ngrxStore: Store,
    private actionState: StateEffects,
  ) {}

  static prettifyXml(xml: string): string {
    if (xml) return vkbeautify.xml(xml) as string;
    return xml;
  }

  ngOnInit(): void {
    this.ngrxStore.dispatch(disableEdit());

    let sub = this.selectedGroupId$
      .pipe(filter((groupId) => !!groupId))
      .subscribe((groupID) => {
        this.groupID = groupID;
      });
    this.subscriptions$.push(sub);
    sub = this.selectedService$.subscribe((service) => {
      this.selectedServiceName = service?.name;
    });
    this.subscriptions$.push(sub);
    sub = this.services$.subscribe((services) => {
      this.serviceMap = services;
    });
    this.subscriptions$.push(sub);
    sub = this.ngrxStore
      .select(SUCCESS_MODEL_XML)
      .pipe(distinctUntilChanged())
      .subscribe((xml) => {
        this.successModelXml = RawEditComponent.prettifyXml(xml);
      });
    this.subscriptions$.push(sub);
    sub = this.ngrxStore
      .select(MEASURE_CATALOG_XML)
      .pipe(
        distinctUntilChanged(),
        filter((catalog) => !!catalog),
      )
      .subscribe((xml) => {
        this.measureCatalogXml = RawEditComponent.prettifyXml(xml);
      });
    this.subscriptions$.push(sub);
  }

  ngOnDestroy(): void {
    this.subscriptions$.forEach((sub) => sub.unsubscribe());
  }

  onServiceSelected(service: ServiceInformation): void {
    this.ngrxStore.dispatch(setService({ service }));
  }

  _onCatalogSaveClicked(): void {
    this.saveInProgress = true;
    this.ngrxStore.dispatch(
      saveCatalog({ xml: this.measureCatalogXml }),
    );
    if (this.saveInProgress) {
      const sub = this.actionState.saveCatalog$
        .pipe(
          timeout(300000),
          catchError(() => {
            return of(
              failureResponse({
                reason: new Error(
                  'The request took too long and was aborted',
                ),
              }),
            );
          }),
        )
        .subscribe((result) => {
          this.saveInProgress = false;

          if (result?.type === HttpActions.SUCCESS_RESPONSE) {
            const message = this.translate.instant(
              'raw-edit.measures.snackbar-success',
            ) as string;
            this.snackBar.open(message, null, {
              duration: 2000,
            });
          } else {
            let message = this.translate.instant(
              'raw-edit.measures.snackbar-failure',
            ) as string;
            if (result && result instanceof failureResponse) {
              message += (result as { reason: Error }).reason.message;
            }

            this.snackBar.open(message, 'Ok');
          }
          sub.unsubscribe();
        });
    }
  }

  _onModelSaveClicked(): void {
    this.saveInProgress = true;

    this.ngrxStore.dispatch(saveModel({ xml: this.successModelXml }));
    if (this.saveInProgress) {
      const sub = this.actionState.saveModel$
        .pipe(
          timeout(300000),
          catchError(() => {
            return of(
              failureResponse({
                reason: new Error(
                  'The request took too long and was aborted',
                ),
              }),
            );
          }),
        )
        .subscribe(
          (
            result: { type: HttpActions } | typeof failureResponse,
          ) => {
            this.saveInProgress = false;
            if (result?.type === HttpActions.SUCCESS_RESPONSE) {
              const message = this.translate.instant(
                'raw-edit.success-models.snackbar-success',
              ) as string;
              this.snackBar.open(message, null, {
                duration: 2000,
              });
            } else {
              let message = this.translate.instant(
                'raw-edit.success-models.snackbar-failure',
              ) as string;
              if (
                result &&
                result instanceof failureResponse &&
                'reason' in result
              )
                message += (
                  result as { type: any; reason: { message: string } }
                ).reason.message;
              this.snackBar.open(message, 'Ok');
            }
            sub.unsubscribe();
          },
        );
    }
  }
}
