import { Component, HostListener, OnInit } from '@angular/core';

@Component({
  selector: 'app-import-dialog',
  templateUrl: './import-dialog.component.html',
  styleUrls: ['./import-dialog.component.scss'],
})
export class ImportDialogComponent implements OnInit {
  @HostListener('window:drop', ['$event.target'])
  onClick(e) {
    this.dropHandler(e);
    e.preventDefault();
  }
  constructor() {
    window.addEventListener(
      'dragover',
      function (e: Event) {
        e = e || event;
        e.preventDefault();
      },
      false,
    );
    window.addEventListener(
      'drop',
      function (e: Event) {
        e = e || event;
        e.preventDefault();
      },
      false,
    );
  }

  ngOnInit(): void {}
  dropHandler(ev) {
    console.log('File(s) dropped');

    if (ev.dataTransfer.items) {
      // Use DataTransferItemList interface to access the file(s)
      for (var i = 0; i < ev.dataTransfer.items.length; i++) {
        // If dropped items aren't files, reject them
        if (ev.dataTransfer.items[i].kind === 'file') {
          var file = ev.dataTransfer.items[i].getAsFile();
          console.log('... file[' + i + '].name = ' + file.name);
        }
      }
    } else {
      // Use DataTransfer interface to access the file(s)
      for (var i = 0; i < ev.dataTransfer.files.length; i++) {
        console.log(
          '... file[' +
            i +
            '].name = ' +
            ev.dataTransfer.files[i].name,
        );
      }
    }
  }
}
