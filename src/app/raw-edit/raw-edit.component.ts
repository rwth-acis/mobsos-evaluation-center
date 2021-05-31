import { Component, OnDestroy, OnInit } from '@angular/core';
import { ServiceInformation, StoreService } from '../store.service';
import { Las2peerService } from '../las2peer.service';
import vkbeautify from 'vkbeautify';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { Store } from '@ngrx/store';
import {
  failureResponse,
  saveCatalog,
  saveModel,
  setService,
  storeSuccessModel,
} from '../services/store.actions';
import {
  MEASURE_CATALOG,
  SELECTED_GROUP,
  SELECTED_GROUP_ID,
  SELECTED_SERVICE,
  SERVICES,
  SUCCESS_MODEL,
} from '../services/store.selectors';
import { catchError, filter, first, map, timeout } from 'rxjs/operators';
import { StateEffects } from '../services/store.effects';
import { of } from 'rxjs';

@Component({
  selector: 'app-raw-edit',
  templateUrl: './raw-edit.component.html',
  styleUrls: ['./raw-edit.component.scss'],
})
export class RawEditComponent implements OnInit, OnDestroy {
  groupID;
  services = [];
  serviceMap = {};
  selectedService: string;

  editorOptions = { theme: 'vs', language: 'xml', automaticLayout: true };
  measureCatalogXml: string;
  successModelXml: string;
  measureCatalogEditor;
  successModelEditor;
  saveInProgress = false;
  selectedGroupId$ = this.ngrxStore.select(SELECTED_GROUP_ID);
  selectedService$ = this.ngrxStore.select(SELECTED_SERVICE);
  measureCatalogInitialized$ = this.ngrxStore.select(MEASURE_CATALOG).pipe(
    filter((catalog) => catalog !== undefined),
    first()
  );
  successModelInitialized$ = this.ngrxStore.select(SUCCESS_MODEL).pipe(
    filter((model) => model !== undefined),
    first()
  );
  services$ = this.ngrxStore.select(SERVICES);

  constructor(
    private store: StoreService,
    private las2peer: Las2peerService,
    private snackBar: MatSnackBar,
    private translate: TranslateService,
    private ngrxStore: Store,
    private actionState: StateEffects
  ) {}

  static prettifyXml(xml) {
    return vkbeautify.xml(xml);
  }

  ngOnInit() {
    this.selectedGroupId$
      .pipe(filter((groupId) => !!groupId))
      .subscribe((groupID) => {
        this.groupID = groupID;
        this.fetchXml();
      });
    this.selectedService$

      .pipe(map((service) => service.name))

      .subscribe((serviceName) => {
        this.selectedService = serviceName;
        this.fetchXml();
      });
    //  this.store.startPolling();
    this.services$.subscribe((services) => {
      this.serviceMap = services;
    });
  }

  ngOnDestroy(): void {
    this.store.stopPolling();
  }

  registerMeasureEditor(editor) {
    this.measureCatalogEditor = editor;
  }

  registerSuccessModelEditor(editor) {
    this.successModelEditor = editor;
  }

  onServiceSelected(service: ServiceInformation) {
    this.ngrxStore.dispatch(setService({ service: service }));
  }

  fetchXml() {
    if (this.groupID) {
      this.las2peer.fetchMeasureCatalog(this.groupID).then((xml) => {
        if (!xml) {
          xml = '';
        }
        xml = RawEditComponent.prettifyXml(xml);
        this.measureCatalogXml = xml;
      });
      if (this.selectedService) {
        const setServiceXml = (xml) => {
          if (!xml) {
            xml = '';
          }
          this.successModelXml = RawEditComponent.prettifyXml(xml);
        };
        this.las2peer
          .fetchSuccessModel(this.groupID, this.selectedService)
          .then(setServiceXml)
          .catch(() => setServiceXml(null));
      }
    }
  }

  _onCatalogSaveClicked() {
    this.saveInProgress = true;
    this.ngrxStore.dispatch(saveCatalog({ xml: this.measureCatalogXml }));
    if (this.saveInProgress) {
      let sub = this.actionState.saveCatalog$
        .pipe(
          timeout(300000),
          catchError(() => {
            return of(
              failureResponse({
                reason: new Error('The request took too long and was aborted'),
              })
            );
          })
        )
        .subscribe((result) => {
          this.saveInProgress = false;

          console.log(result);

          if (result && result instanceof failureResponse) {
            let message =
              this.translate.instant('raw-edit.measures.snackbar-failure') +
              (result as { reason: Error }).reason.message;

            this.snackBar.open(message, 'Ok');
          } else {
            let message = this.translate.instant(
              'raw-edit.measures.snackbar-success'
            );
            this.snackBar.open(message, null, {
              duration: 2000,
            });
          }
          sub.unsubscribe();
        });
    }
  }

  _onModelSaveClicked() {
    this.saveInProgress = true;

    this.ngrxStore.dispatch(saveModel({ xml: this.measureCatalogXml }));
    if (this.saveInProgress) {
      let sub = this.actionState.saveModel$
        .pipe(
          timeout(300000),
          catchError(() => {
            return of(
              failureResponse({
                reason: new Error('The request took too long and was aborted'),
              })
            );
          })
        )
        .subscribe((result) => {
          this.saveInProgress = false;

          console.log(result);

          if (result && result instanceof failureResponse) {
            let message =
              this.translate.instant(
                'raw-edit.success-models.snackbar-failure'
              ) + (result as { reason: Error }).reason.message;

            this.snackBar.open(message, 'Ok');
          } else {
            let message = this.translate.instant(
              'raw-edit.success-models.snackbar-success'
            );
            this.snackBar.open(message, null, {
              duration: 2000,
            });
          }
          sub.unsubscribe();
        });
    }
  }
}
function storeMeasureCatalog(arg0: { xml: string }): any {
  throw new Error('Function not implemented.');
}
