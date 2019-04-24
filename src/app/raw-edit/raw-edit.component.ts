import {Component, OnInit} from '@angular/core';
import {StoreService} from '../store.service';

@Component({
  selector: 'app-raw-edit',
  templateUrl: './raw-edit.component.html',
  styleUrls: ['./raw-edit.component.scss']
})
export class RawEditComponent implements OnInit {
  groups = [];
  services = [];

  constructor(private store: StoreService) {
  }

  ngOnInit() {
    this.store.startPolling();
    this.store.groups.subscribe((groups) => this.groups = Object.values(groups).sort());
    this.store.services.subscribe((services) => {
      const serviceList = [];
      for (const service of services) {
        serviceList.push(service.name);
      }
      this.services = serviceList;
    });
  }

}
