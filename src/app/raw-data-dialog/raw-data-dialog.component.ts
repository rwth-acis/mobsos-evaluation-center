import {
  AfterViewInit,
  Component,
  ViewChild,
  OnInit,
  Input,
  Inject,
} from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
interface PeriodicElement {
  name: string;
  position: number;
  weight: number;
  symbol: string;
}
const ELEMENT_DATA: PeriodicElement[] = [
  { position: 1, name: 'Hydrogen', weight: 1.0079, symbol: 'H' },
  { position: 2, name: 'Helium', weight: 4.0026, symbol: 'He' },
  { position: 3, name: 'Lithium', weight: 6.941, symbol: 'Li' },
  { position: 4, name: 'Beryllium', weight: 9.0122, symbol: 'Be' },
  { position: 5, name: 'Boron', weight: 10.811, symbol: 'B' },
  { position: 6, name: 'Carbon', weight: 12.0107, symbol: 'C' },
  { position: 7, name: 'Nitrogen', weight: 14.0067, symbol: 'N' },
  { position: 8, name: 'Oxygen', weight: 15.9994, symbol: 'O' },
  { position: 9, name: 'Fluorine', weight: 18.9984, symbol: 'F' },
  { position: 10, name: 'Neon', weight: 20.1797, symbol: 'Ne' },
];
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
