import { Component, Input, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  NUMBER_OF_REQUIREMENTS,
  SELECTED_GROUP,
  USER,
} from '../../services/store.selectors';

@Component({
  selector: 'app-workspace',
  templateUrl: './workspace.component.html',
  styleUrls: ['./workspace.component.scss'],
})
export class WorkspaceComponent implements OnInit {
  @Input() restricted = false;
  user$ = this.ngrxStore.select(USER);
  selectedGroup$ = this.ngrxStore.select(SELECTED_GROUP);
  numberOfRequirements$ = this.ngrxStore.select(
    NUMBER_OF_REQUIREMENTS,
  );
  constructor(private ngrxStore: Store) {}

  ngOnInit(): void {}
}
