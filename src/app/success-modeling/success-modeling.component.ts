import { Component, Input, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  NUMBER_OF_REQUIREMENTS,
  SELECTED_GROUP,
  USER,
} from '../services/store.selectors';

@Component({
  selector: 'app-success-modeling',
  templateUrl: './success-modeling.component.html',
  styleUrls: ['./success-modeling.component.scss'],
})
export class SuccessModelingComponent implements OnInit {
  @Input() restricted = false;

  user$ = this.ngrxStore.select(USER);
  selectedGroup$ = this.ngrxStore.select(SELECTED_GROUP);
  numberOfRequirements$ = this.ngrxStore.select(
    NUMBER_OF_REQUIREMENTS,
  );
  constructor(private ngrxStore: Store) {}

  ngOnInit(): void {}
}
