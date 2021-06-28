import { Component, OnInit } from '@angular/core';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { Store } from '@ngrx/store';
import { setNumberOfRequirements } from '../services/store.actions';
import { SUCCESS_MODEL } from '../services/store.selectors';

@Component({
  selector: 'app-bottom-sheet',
  templateUrl: './bottom-sheet.component.html',
  styleUrls: ['./bottom-sheet.component.scss'],
})
export class BottomSheetComponent implements OnInit {
  numberOfRequirements = 0;
  successModel$ = this.ngrxStore.select(SUCCESS_MODEL);
  ngOnInit(): void {}

  constructor(
    private _bottomSheetRef: MatBottomSheetRef<BottomSheetComponent>,
    private ngrxStore: Store,
  ) {}

  openLink(event: MouseEvent): void {
    this._bottomSheetRef.dismiss();
    event.preventDefault();
  }

  setNumberOfRequirements(n: number) {
    this.numberOfRequirements = n;
    this.ngrxStore.dispatch(setNumberOfRequirements({ n }));
  }
}
