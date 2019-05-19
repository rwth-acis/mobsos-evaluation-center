import {Component, OnInit} from '@angular/core';
import {StoreService} from '../store.service';
import {Las2peerService} from '../las2peer.service';
import vkbeautify from 'vkbeautify';
import {MatSnackBar} from "@angular/material";
import {TranslateService} from "@ngx-translate/core";

@Component({
  selector: 'app-raw-edit',
  templateUrl: './raw-edit.component.html',
  styleUrls: ['./raw-edit.component.scss']
})
export class RawEditComponent implements OnInit {

  groupID;
  services = [];
  serviceMap = {};
  selectedService: string;
  editorOptions = {theme: 'vs', language: 'xml', automaticLayout: true};
  measureCatalogXml: string;
  successModelXml: string;
  measureCatalogEditor;
  successModelEditor;
  saveInProgress = false;

  constructor(private store: StoreService, private las2peer: Las2peerService, private snackBar: MatSnackBar,
              private translate: TranslateService) {
  }

  static prettifyXml(xml) {
    return vkbeautify.xml(xml);
  }

  ngOnInit() {
    this.store.selectedGroup.subscribe((groupID) => {
      this.groupID = groupID;
      this.fetchXml();
    });
    this.store.startPolling();
    this.store.services.subscribe((services) => {
      this.services = Object.keys(services);
      this.serviceMap = services;
    });
  }

  registerMeasureEditor(editor) {
    this.measureCatalogEditor = editor;
  }

  registerSuccessModelEditor(editor) {
    this.successModelEditor = editor;
  }

  onServiceSelected(service) {
    this.selectedService = service;
    this.fetchXml();
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
        this.las2peer.fetchSuccessModel(this.groupID, this.selectedService).then(setServiceXml)
          .catch(() => setServiceXml(null));
      }
    }
  }

  _onCatalogSaveClicked() {
    this.saveInProgress = true;
    this.las2peer.saveMeasureCatalog(this.groupID, this.measureCatalogXml)
      .then(async () => {
        this.saveInProgress = false;
        const message = await this.translate.get('raw-edit.measures.snackbar-success').toPromise();
        this.snackBar.open(message, null, {
          duration: 2000,
        });
      })
      .catch(async () => {
        this.saveInProgress = false;
        const message = await this.translate.get('raw-edit.measures.snackbar-failure').toPromise();
        this.snackBar.open(message, null, {
          duration: 2000,
        });
      });
  }

  _onModelSaveClicked() {
    this.saveInProgress = true;
    this.las2peer.saveSuccessModel(this.groupID, this.selectedService, this.successModelXml)
      .then(async () => {
        this.saveInProgress = false;
        const message = await this.translate.get('raw-edit.success-models.snackbar-success').toPromise();
        this.snackBar.open(message, null, {
          duration: 2000,
        });
      })
      .catch(async () => {
        this.saveInProgress = false;
        const message = await this.translate.get('raw-edit.success-models.snackbar-failure').toPromise();
        this.snackBar.open(message, null, {
          duration: 2000,
        });
      });
  }
}
