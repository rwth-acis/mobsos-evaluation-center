import {Component, OnInit} from '@angular/core';
import {ServiceCollection, StoreService} from '../store.service';
import {Las2peerService} from '../las2peer.service';
import {SuccessModel} from '../../success-model/success-model';
import {MeasureCatalog} from '../../success-model/measure-catalog';
import {NGXLogger} from 'ngx-logger';


@Component({
  selector: 'app-success-modeling',
  templateUrl: './success-modeling.component.html',
  styleUrls: ['./success-modeling.component.scss']
})
export class SuccessModelingComponent implements OnInit {
  groupID;
  services = [];
  serviceMap: ServiceCollection = {};
  selectedService: string;
  measureCatalogXml: Document;
  measureCatalog: MeasureCatalog;
  successModelXml: Document;
  successModel: SuccessModel;

  constructor(private store: StoreService, private las2peer: Las2peerService, private logger: NGXLogger) {
  }

  static parseXml(xml) {
    const parser = new DOMParser();
    return parser.parseFromString(xml, 'text/xml');
  }

  parseCatalog(xml: Document): MeasureCatalog {
    try {
      return MeasureCatalog.fromXml(xml.documentElement);
    } catch (e) {
      this.logger.warn(e);
    }
  }

  parseModel(xml: Document) {
    try {
      return SuccessModel.fromXml(xml.documentElement);
    } catch (e) {
      this.logger.warn(e);
    }
  }

  ngOnInit() {
    this.store.selectedGroup.subscribe((groupID) => {
      this.groupID = groupID;
      this.fetchXml();
    });
    this.store.selectedService.subscribe((serviceID) => {
      this.selectedService = serviceID;
      this.fetchXml();
    });
    this.store.startPolling();
    this.store.services.subscribe((services) => {
      this.services = Object.keys(services);
      this.serviceMap = services;
    });
  }

  onServiceSelected(service) {
    this.store.selectedServiceSubject.next(service);
  }

  fetchXml() {
    if (this.groupID) {
      this.las2peer.fetchMeasureCatalog(this.groupID).then((xml) => {
        if (!xml) {
          xml = '';
        }
        this.measureCatalogXml = SuccessModelingComponent.parseXml(xml);
        this.measureCatalog = this.parseCatalog(this.measureCatalogXml);
      }).catch(() => {
        this.measureCatalogXml = null;
        this.measureCatalog = null;
      });
      if (this.selectedService) {
        const setServiceXml = (xml) => {
          if (!xml) {
            xml = '';
          }
          this.successModelXml = SuccessModelingComponent.parseXml(xml);
          this.successModel = this.parseModel(this.successModelXml);
        };
        this.las2peer.fetchSuccessModel(this.groupID, this.selectedService).then(setServiceXml)
          .catch(() => {
            this.successModelXml = null;
            this.successModelXml = null;
          });
      }
    }
  }

}
