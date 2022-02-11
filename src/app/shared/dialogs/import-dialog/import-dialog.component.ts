import {
  Component,
  HostListener,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { SuccessModel } from 'src/app/models/success.model';
import {
  enableEdit,
  setService,
  setServiceName,
  storeCatalog,
  storeSuccessModel,
} from 'src/app/services/store.actions';

@Component({
  selector: 'app-import-dialog',
  templateUrl: './import-dialog.component.html',
  styleUrls: ['./import-dialog.component.scss'],
})
export class ImportDialogComponent implements OnInit {
  @HostListener('window:drop', ['$event.target'])
  @ViewChild('fileInput')
  fileInput;
  fileName: string;
  static xml: string;
  constructor(
    private store: Store,
    private dialogRef: MatDialogRef<ImportDialogComponent>,
  ) {}

  ngOnInit(): void {}
  dropHandler(ev) {
    const file = ev.target.files[0];
    this.fileName = file.name;
    if (file.type !== 'text/xml') {
      ImportDialogComponent.xml = null;
      this.fileInput.nativeElement.value = '';
      return alert('You can only upload xml files');
    }
    if (this.fileName) {
      var reader = new FileReader();
      reader.readAsText(file, 'UTF-8');
      reader.onload = function (evt) {
        ImportDialogComponent.xml = evt.target.result as string;
      };
      reader.onerror = function (evt) {};
    }
  }

  importXML() {
    const parser = new DOMParser();
    const XMLElement = parser.parseFromString(
      ImportDialogComponent.xml,
      'text/xml',
    );
    const isSuccessModel = ImportDialogComponent.xml
      .slice(0, 10)
      .includes('Success');
    const isMeasureCatalog = ImportDialogComponent.xml
      .slice(0, 10)
      .includes('Catalog');

    if (isSuccessModel) {
      const model = SuccessModel.fromXml(XMLElement.documentElement);
      this.store.dispatch(
        setServiceName({ serviceName: model.service }),
      );
      this.store.dispatch(
        storeSuccessModel({ xml: ImportDialogComponent.xml }),
      );
      this.store.dispatch(enableEdit());
      this.dialogRef.close();
    } else if (isMeasureCatalog) {
      this.store.dispatch(
        storeCatalog({ xml: ImportDialogComponent.xml }),
      );
      this.dialogRef.close();
    }
    return alert(
      'The filetype is not supported. Please only submit valid success model or catalog files',
    );
  }
}
