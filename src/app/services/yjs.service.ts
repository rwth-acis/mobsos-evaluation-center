import { Injectable } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { BehaviorSubject } from 'rxjs';
import { environment } from 'src/environments/environment';

// import {
//   WebsocketProvider,
//   WebsocketsSharedDocument,
// } from ;
// import { Injectable } from '@angular/core';
// import { BehaviorSubject } from 'rxjs';
import { cloneDeep, isEqual, isPlainObject } from 'lodash';
import { Doc } from 'yjs';
// import { NGXLogger } from 'ngx-logger';

import { WebsocketProvider } from 'y-websocket';
import { YMap } from 'yjs/dist/src/types/YMap';

@Injectable({
  providedIn: 'root',
})
export class YjsService {
  // object containing cleanup functions to be invoked when the type is no longer needed
  private removeListenersCallbacks: { [key: string]: () => void } =
    {};
  private sharedDocument = new Doc();
  private connectedSubject = new BehaviorSubject<boolean>(false);
  public connected$ = this.connectedSubject.asObservable();

  constructor(private logger: NGXLogger) {
    const provider = new WebsocketProvider(
      environment.yJsWebsocketUrl,
      'mobsos-ec',
      this.sharedDocument,
    );
    this.sharedDocument.on('status', (event) => {
      this.logger.debug('Y-JS: ' + event.status);
      if (event.status === 'connected') {
        this.connectedSubject.next(true);
      } else {
        this.connectedSubject.next(false);
      }
    });
  }
  syncObject(
    name: string,
    subject: BehaviorSubject<object>,
    initializedSubject: BehaviorSubject<boolean>,
  ) {
    //  registerStruct(0, GC);
    // registerStruct(1, ItemJSON);
    // registerStruct(2, ItemString);
    // registerStruct(3, ItemFormat);
    // registerStruct(4, Delete);
    // registerStruct(5, YArray);
    // registerStruct(6, YMap);
    // registerStruct(7, YText);
    // registerStruct(8, YXmlFragment);
    // registerStruct(9, YXmlElement);
    // registerStruct(10, YXmlText);
    // registerStruct(11, YXmlHook);
    // registerStruct(12, ItemEmbed);
    // registerStruct(13, ItemBinary);
    const type = this.sharedDocument.get(name);
    const map = this.sharedDocument.getMap(name);
    const subscription = subject.subscribe((obj) => {
      this.logger.debug(
        'Syncing local object with remote y-js map...',
      );
      this._syncObjectToMap(cloneDeep(obj), map);
    });
    const observeFn = () => {
      console.log('Syncing remote y-js map with local object...');
      const cloneObj = cloneDeep(type.toJSON());
      subject.next(cloneObj);
      initializedSubject.next(true);
    };
    type.observe(observeFn);
    type.observeDeep(observeFn);
    // initial yjs sync does not take place, when remote and local object are already equal
    // in this case we set the object to initialized as soon as the yjs connection is established
    this.connected$.subscribe((connected) => {
      if (!initializedSubject.getValue() && connected) {
        const mapAsObj = type.toJSON();
        if (isEqual(subject.getValue(), mapAsObj)) {
          initializedSubject.next(true);
        }
      }
    });
    this.stopSync(name);
    // deposit cleanup function to be called when the type is no longer needed
    this.removeListenersCallbacks[name] = () => {
      subscription.unsubscribe();
      type.unobserve(observeFn);
      type.unobserveDeep(observeFn);
    };
  }

  stopSync(name: string) {
    if (this.removeListenersCallbacks[name]) {
      this.removeListenersCallbacks[name]();
      delete this.removeListenersCallbacks[name];
    }
  }

  private _syncObjectToMap(obj: object, map: YMap<any>) {
    const mapAsObj = map.toJSON();
    if (isEqual(obj, mapAsObj)) {
      return;
    }
    // delete elements that are present in the map but not in the object
    const deletedKeys = Object.keys(mapAsObj).filter(
      (key) => !Object.keys(obj).includes(key),
    );
    deletedKeys.map((deletedKey) => map.delete(deletedKey));
    // sync elements from object to map
    for (const key of Object.keys(obj)) {
      const objValue = obj[key];
      let mapValue = map.get(key);
      if (isEqual(objValue, mapValue)) {
        continue;
      }
      // use YMap if value is an object and use the value itself otherwise
      if (isPlainObject(objValue)) {
        if (!(mapValue instanceof YMap)) {
          map.set(key, new YMap());
          mapValue = map.get(key);
        }
        this._syncObjectToMap(objValue, mapValue);
      } else {
        if (objValue !== null) {
          map.set(key, objValue);
        }
      }
    }
  }
}
