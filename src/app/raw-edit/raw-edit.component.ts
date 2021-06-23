import { Component, OnDestroy, OnInit } from '@angular/core';

import vkbeautify from 'vkbeautify';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { Store } from '@ngrx/store';
import {
  disableEdit,
  failureResponse,
  PostActions,
  saveCatalog,
  saveModel,
  setService,
} from '../services/store.actions';
import {
  MEASURE_CATALOG,
  MEASURE_CATALOG_XML,
  _SELECTED_GROUP_ID,
  SELECTED_SERVICE,
  _SERVICES,
  SUCCESS_MODEL,
  SUCCESS_MODEL_XML,
} from '../services/store.selectors';
import {
  catchError,
  distinctUntilChanged,
  filter,
  first,
  map,
  tap,
  timeout,
  withLatestFrom,
} from 'rxjs/operators';
import { StateEffects } from '../services/store.effects';
import { combineLatest, of } from 'rxjs';
import { ServiceInformation } from '../models/service.model';
import { SuccessModel } from '../models/success.model';
import { MeasureCatalog } from '../models/measure.catalog';

@Component({
  selector: 'app-raw-edit',
  templateUrl: './raw-edit.component.html',
  styleUrls: ['./raw-edit.component.scss'],
})
export class RawEditComponent implements OnInit, OnDestroy {
  groupID;
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
  measureCatalogEditor;
  successModelEditor;
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
  ]).pipe(
    map(
      ([groupid, service]) =>
        !!groupid && !!service && !this.saveInProgress,
    ),
  );

  canSaveMeasureCatalog$ = this.selectedGroupId$.pipe(
    map((groupid) => !!groupid && !this.saveInProgress),
  );

  constructor(
    private snackBar: MatSnackBar,
    private translate: TranslateService,
    private ngrxStore: Store,
    private actionState: StateEffects,
  ) {}

  static prettifyXml(xml) {
    if (xml) return vkbeautify.xml(xml);
    return xml;
  }

  ngOnInit() {
    this.canSaveSuccessModel$.subscribe((sub) => console.log(sub));
    this.ngrxStore.dispatch(disableEdit());
    this.selectedGroupId$
      .pipe(filter((groupId) => !!groupId))
      .subscribe((groupID) => {
        this.groupID = groupID;
      });
    this.selectedService$.subscribe((service) => {
      this.selectedServiceName = service?.name;
    });
    this.services$.subscribe((services) => {
      this.serviceMap = services;
    });
    this.ngrxStore
      .select(SUCCESS_MODEL_XML)
      .pipe(distinctUntilChanged())
      .subscribe((xml) => {
        this.successModelXml = RawEditComponent.prettifyXml(xml);
      });
    this.ngrxStore
      .select(MEASURE_CATALOG_XML)
      .pipe(
        distinctUntilChanged(),
        filter((catalog) => !!catalog),
      )
      .subscribe((xml) => {
        this.measureCatalogXml = RawEditComponent.prettifyXml(xml);
      });
  }

  ngOnDestroy(): void {}

  registerMeasureEditor(editor) {
    this.measureCatalogEditor = editor;
  }

  registerSuccessModelEditor(editor) {
    this.successModelEditor = editor;
  }

  onServiceSelected(service: ServiceInformation) {
    this.ngrxStore.dispatch(setService({ service }));
  }

  fetchXml() {
    // if (this.groupID) {
    //   this.las2peer.fetchMeasureCatalog(this.groupID).then((xml) => {
    //     if (!xml) {
    //       xml = '';
    //     }
    //     xml = RawEditComponent.prettifyXml(xml);
    //     this.measureCatalogXml = xml;
    //   });
    //   if (this.selectedService) {
    //     const setServiceXml = (xml) => {
    //       if (!xml) {
    //         xml = '';
    //       }
    //       this.successModelXml = RawEditComponent.prettifyXml(xml);
    //     };
    //     this.las2peer
    //       .fetchSuccessModel(this.groupID, this.selectedService)
    //       .then(setServiceXml)
    //       .catch(() => setServiceXml(null));
    //   }
    // }
  }

  _onCatalogSaveClicked() {
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

          if (result?.type === PostActions.SUCCESS_RESPONSE) {
            const message = this.translate.instant(
              'raw-edit.measures.snackbar-success',
            );
            this.snackBar.open(message, null, {
              duration: 2000,
            });
          } else {
            let message = this.translate.instant(
              'raw-edit.measures.snackbar-failure',
            );
            if (result && result instanceof failureResponse) {
              message += (result as { reason: Error }).reason.message;
            }

            this.snackBar.open(message, 'Ok');
          }
          sub.unsubscribe();
        });
    }
  }

  _onModelSaveClicked() {
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
            result: { type: PostActions } | typeof failureResponse,
          ) => {
            this.saveInProgress = false;
            if (result?.type === PostActions.SUCCESS_RESPONSE) {
              const message = this.translate.instant(
                'raw-edit.success-models.snackbar-success',
              );
              this.snackBar.open(message, null, {
                duration: 2000,
              });
            } else {
              let message = this.translate.instant(
                'raw-edit.success-models.snackbar-failure',
              );
              if (result && result instanceof failureResponse)
                message += (result as { type; reason }).reason
                  .message;
              this.snackBar.open(message, 'Ok');
            }
            sub.unsubscribe();
          },
        );
    }
  }
}
