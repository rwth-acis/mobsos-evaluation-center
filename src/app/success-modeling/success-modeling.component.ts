import { Component, Input, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  NUMBER_OF_REQUIREMENTS,
  SELECTED_GROUP,
  USER,
} from '../services/store.selectors';

import {
  catchError,
  filter,
  map,
  timeout,
  withLatestFrom,
} from 'rxjs/operators';
import { iconMap, translationMap } from './config';
import { SuccessModel } from '../models/success.model';
import { StateEffects } from '../services/store.effects';
import { combineLatest, of, Subscription } from 'rxjs';
import {
  animate,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ServiceInformation } from '../models/service.model';
import { IQuestionnaire } from '../models/questionnaire.model';
import { environment } from 'src/environments/environment';

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
