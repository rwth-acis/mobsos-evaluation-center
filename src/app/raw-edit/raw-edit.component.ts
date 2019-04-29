import {Component, OnInit} from '@angular/core';
import {StoreService} from '../store.service';
import {Las2peerService} from '../las2peer.service';
import vkbeautify from 'vkbeautify';

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

  constructor(private store: StoreService, private las2peer: Las2peerService) {
    this.store.selectedGroup.subscribe((groupID) => {
      this.groupID = groupID;
      this.fetchXml();
    });
  }

  static objectFlip(obj) {
    const ret = {};
    Object.keys(obj).forEach((key) => {
      ret[obj[key]] = key;
    });
    return ret;
  }

  static prettifyXml(xml) {
    return vkbeautify.xml(xml);
  }

  ngOnInit() {
    this.store.startPolling();
    this.store.services.subscribe((services) => {
      const serviceList = [];
      const serviceMap = {};
      for (const service of services) {
        serviceList.push(service.name);
        // use most recent release and extract the human readable name
        const releases = Object.keys(service.releases).sort();
        serviceMap[service.name] = service.releases[releases.slice(-1)[0]].supplement.name;
      }
      this.services = serviceList;
      this.serviceMap = serviceMap;
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
        this.las2peer.fetchSuccessModel(this.groupID, this.selectedService).then((xml) => {
          if (!xml) {
            xml = '';
          }
          this.successModelXml = RawEditComponent.prettifyXml(xml);
        });
      }
    }
  }

}
