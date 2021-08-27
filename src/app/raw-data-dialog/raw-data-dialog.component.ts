import {
  AfterViewInit,
  Component,
  ViewChild,
  OnInit,
  Inject,
} from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
@Component({
  selector: 'app-raw-data-dialog',
  templateUrl: './raw-data-dialog.component.html',
  styleUrls: ['./raw-data-dialog.component.scss'],
})
export class RawDataDialogComponent implements OnInit, AfterViewInit {
  @ViewChild(MatSort) sort: MatSort;

  dataSource: MatTableDataSource<any>;
  displayedColumns: string[];
  res;
  constructor(
    public dialogRef: MatDialogRef<RawDataDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public rawData: any[][],
  ) {}

  ngOnInit(): void {
    if (this.rawData.length > 2) {
      this.displayedColumns = this.rawData[0] as string[];
      const arr = [];
      for (const items of this.rawData.slice(2)) {
        const obj = {};
        for (let index = 0; index < items.length; index++) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          obj[this.displayedColumns[index]] = items[index];
        }
        arr.push(obj);
      }
      this.dataSource = new MatTableDataSource(arr);
      this.res = arr;
    }
  }
  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
  }
}
