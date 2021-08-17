import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { StateEffects } from '../services/store.effects';
import {
  NUMBER_OF_REQUIREMENTS,
  SELECTED_GROUP,
  _USER,
} from '../services/store.selectors';

@Component({
  selector: 'app-workspace',
  templateUrl: './workspace.component.html',
  styleUrls: ['./workspace.component.scss'],
})
export class WorkspaceComponent implements OnInit {
  @Input() restricted = false;
  selectedTab = 0;
  user$ = this.ngrxStore.select(_USER);
  selectedGroup$ = this.ngrxStore.select(SELECTED_GROUP);
  numberOfRequirements$ = this.ngrxStore.select(
    NUMBER_OF_REQUIREMENTS,
  );
  constructor(private ngrxStore: Store, private router: Router) {}

  ngOnInit(): void {
    if (this.router.url.match('/requirements')) {
      this.selectedTab = 1;
    } else if (this.router.url.match('/modeling')) {
      this.selectedTab = 0;
    }
  }
}
