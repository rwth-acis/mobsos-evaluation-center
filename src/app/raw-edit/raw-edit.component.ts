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

  constructor(private store: StoreService, private las2peer: Las2peerService) {
  }

  groups = [];
  services = [];
  groupMap = {};
  selectedGroup: string;
  selectedService: string;
  editorOptions = {theme: 'vs', language: 'xml', automaticLayout: true};
  measureCatalogXml: string;
  successModelXml: string;
  measureCatalogEditor;
  successModelEditor;

  static objectFlip(obj) {
    const ret = {};
    Object.keys(obj).forEach((key) => {
      ret[obj[key]] = key;
    });
    return ret;
  }

  static prettifyXml(xml) {
    return vkbeautify.xml(xml)
  }

  ngOnInit() {
    this.store.startPolling();
    this.store.groups.subscribe((groups) => {
      this.groups = Object.values(groups).sort();
      this.groupMap = RawEditComponent.objectFlip(groups);
    });
    this.store.services.subscribe((services) => {
      const serviceList = [];
      for (const service of services) {
        serviceList.push(service.name);
      }
      this.services = serviceList;
    });
  }

  registerMeasureEditor(editor) {
    this.measureCatalogEditor = editor;
  }

  registerSuccessModelEditor(editor) {
    this.successModelEditor = editor;
  }


  onGroupSelected(group) {
    this.selectedGroup = group;
    this.fetchXml();
  }

  onServiceSelected(service) {
    this.selectedService = service;
    this.fetchXml();
  }

  fetchXml() {
    if (this.selectedGroup) {
      const groupID = this.groupMap[this.selectedGroup];
      this.las2peer.fetchMeasureCatalog(groupID).then((xml) => {
        xml = RawEditComponent.prettifyXml(xml);
        this.measureCatalogXml = xml;
      });
      if (this.selectedService) {
        this.las2peer.fetchSuccessModel(groupID, this.selectedService).then((xml) => {
          this.successModelXml = RawEditComponent.prettifyXml(xml);
        });
      }
    }
  }

}
