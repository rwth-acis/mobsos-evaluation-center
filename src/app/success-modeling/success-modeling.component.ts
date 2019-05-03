import {Component, OnInit} from '@angular/core';
import {StoreService} from '../store.service';
import {Las2peerService} from "../las2peer.service";

@Component({
  selector: 'app-success-modeling',
  templateUrl: './success-modeling.component.html',
  styleUrls: ['./success-modeling.component.scss']
})
export class SuccessModelingComponent implements OnInit {
  groupID;
  services = [];
  serviceMap = {};
  selectedService: string;
  measureCatalogXml: string;
  successModelXml: string;

  constructor(private store: StoreService, private las2peer: Las2peerService,) {
  }

  ngOnInit() {
    this.store.selectedGroup.subscribe((groupID) => {
      this.groupID = groupID;
      this.fetchXml();
    });
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
        this.measureCatalogXml = xml;
      });
      if (this.selectedService) {
        const setServiceXml = (xml) => {
          if (!xml) {
            xml = '';
          }
          this.successModelXml = xml;
        };
        this.las2peer.fetchSuccessModel(this.groupID, this.selectedService).then(setServiceXml)
          .catch(() => setServiceXml(null));
      }
    }
  }

}
