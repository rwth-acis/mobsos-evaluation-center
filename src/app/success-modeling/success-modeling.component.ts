import {Component, OnInit} from '@angular/core';
import {StoreService} from '../store.service';

@Component({
  selector: 'app-success-modeling',
  templateUrl: './success-modeling.component.html',
  styleUrls: ['./success-modeling.component.scss']
})
export class SuccessModelingComponent implements OnInit {

  constructor(private store: StoreService) {
  }

  ngOnInit() {
    this.store.startPolling();
  }

}
