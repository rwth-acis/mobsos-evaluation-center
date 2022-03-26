import { Component, Input, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  USER,
  SELECTED_GROUP,
  NUMBER_OF_REQUIREMENTS,
} from 'src/app/services/store/store.selectors';

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
