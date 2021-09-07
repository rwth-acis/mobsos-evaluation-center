import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';

import { SUCCESS_MODEL } from '../../services/store.selectors';

@Component({
  selector: 'app-requirements',
  templateUrl: './requirements.component.html',
  styleUrls: ['./requirements.component.scss'],
})
export class RequirementsComponent implements OnInit {
  successModel$ = this.ngrxStore.select(SUCCESS_MODEL);
  constructor(private ngrxStore: Store) {}

  ngOnInit(): void {}
  openLink(event: MouseEvent): void {
    event.preventDefault();
  }
}
