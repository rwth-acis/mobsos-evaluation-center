import {Y} from 'yjs';
import * as yText from 'y-text';
import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class YJsService {

  constructor() {
  }

  async getSyncedSubject(name: string): Promise<BehaviorSubject<yText>> {
    const share = {};
    share[name] = 'Text';
    const y = new Y({
      db: {
        name: 'memory'
      },
      connector: {
        name: 'websockets-client',
        room: 'mobsos-ec',
        url: 'localhost:1234',
      },
      sourceDir: 'node_modules',
      share,
    });
    const sharedVar: yText = y.share[name];
    return sharedVar;

  }
}
