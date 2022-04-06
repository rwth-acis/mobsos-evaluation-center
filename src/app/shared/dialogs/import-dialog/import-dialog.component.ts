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
  addModelToWorkSpace,
  enableEdit,
  setServiceName,
  storeCatalog,
} from 'src/app/services/store/store.actions';

@Component({
  selector: 'app-import-dialog',
  templateUrl: './import-dialog.component.html',
  styleUrls: ['./import-dialog.component.scss'],
})
export class ImportDialogComponent implements OnInit {
  static xml: string;
  @HostListener('window:drop', ['$event.target'])
  @ViewChild('fileInput')
  fileInput;
  fileName: string;

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
      const reader = new FileReader();
      reader.readAsText(file, 'UTF-8');
      reader.onload = function (evt) {
        ImportDialogComponent.xml = evt.target.result as string;
      };
      reader.onerror = function () {};
    }
  }

  importXML() {
    const parser = new DOMParser();
    const XMLElement = parser.parseFromString(
      ImportDialogComponent.xml,
      'text/xml',
    );
    const rootNodeName = XMLElement.firstChild.nodeName;
    const isSuccessModel = rootNodeName === 'SuccessModel';
    const isMeasureCatalog = rootNodeName === 'Catalog';
    if (!isSuccessModel && !isMeasureCatalog)
      return alert(
        'The filetype is not supported. Please only submit valid success model or catalog files',
      );

    if (isSuccessModel) {
      try {
        const model = SuccessModel.fromXml(
          XMLElement.documentElement,
        );
        this.store.dispatch(enableEdit());
        this.store.dispatch(
          setServiceName({ serviceName: model.service }),
        );
        setTimeout(() => {
          this.store.dispatch(
            addModelToWorkSpace({ xml: ImportDialogComponent.xml }),
          );
          alert(
            'Success Model successfully imported. You still need to save the model for the chages to take effect.',
          );
          return this.dialogRef.close();
        }, 1000);
      } catch (e) {
        return alert('The success model file is broken.');
      }
    } else if (isMeasureCatalog) {
      try {
        this.store.dispatch(
          storeCatalog({ xml: ImportDialogComponent.xml }),
        );
        alert(
          'Measure catalog successfully imported. You still need to save the model for the chages to take effect.',
        );
        return this.dialogRef.close();
      } catch (e) {
        return alert('The measure catalog file is broken.');
      }
    }
  }
}
