import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { AUTHENTICATED } from 'src/app/services/store/store.selectors';

@Component({
  selector: 'app-info',
  templateUrl: './info.component.html',
  styleUrls: ['./info.component.scss'],
})
export class InfoComponent implements OnInit {
  authenticated$ = this.store.select(AUTHENTICATED);

  constructor(private store: Store) {}

  ngOnInit(): void {}
}
