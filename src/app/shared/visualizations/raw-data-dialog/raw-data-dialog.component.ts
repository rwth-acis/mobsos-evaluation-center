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
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { cloneDeep } from 'lodash-es';
@Component({
  selector: 'app-raw-data-dialog',
  templateUrl: './raw-data-dialog.component.html',
  styleUrls: ['./raw-data-dialog.component.scss'],
})
export class RawDataDialogComponent implements OnInit, AfterViewInit {
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  dataSource: MatTableDataSource<any>;
  displayedColumns: string[];
  res;
  constructor(
    public dialogRef: MatDialogRef<RawDataDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public rawData: any[][],
  ) {}

  ngOnInit(): void {
    if (this.rawData.length > 2) {
      this.displayedColumns = [...(this.rawData[0] as string[])]; // contains the labels
      for (let i = 0; i < this.rawData[1].length; i++) {
        this.displayedColumns[i] =
          this.displayedColumns[i] +
          ` (type: ${this.rawData[1][i] as string})`; // add type of the column
      }
      const o = this.rawData.slice(2).map((row) => {
        // for the table we need to transform each row in our array to an object with the corresponding label as key
        const obj = {};
        for (let index = 0; index < row.length; index++) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          obj[this.displayedColumns[index]] = row[index];
        }
        return obj;
      });

      this.dataSource = new MatTableDataSource(o);
      this.res = o;
    } else {
      console.error('Invalid data input');
      this.dataSource = new MatTableDataSource([]);
    }
  }
  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  downloadData() {
    if (this.rawData.length > 2) {
      const copy = cloneDeep(this.rawData);
      copy.splice(1, 1); // remove the data type row
      const csvString = copy
        .map((row) => {
          return row.join(',');
        })
        .join('\n');
      const blob = new Blob([csvString], {
        type: 'text/csv;charset=utf-8',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'data.csv');
      link.click();
    }
  }
}
