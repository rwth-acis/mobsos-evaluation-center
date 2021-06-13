import { Injectable } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { BehaviorSubject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { cloneDeep, isEqual, isPlainObject } from 'lodash';
import { Doc, Map } from 'yjs';
import { WebsocketProvider } from 'y-websocket';

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
      'mobsos-ec', // room name
      this.sharedDocument, // collection of properties which will be synced
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
    const type = this.sharedDocument.get(name);
    const map = this.sharedDocument.getMap(name);
    const subscription = subject.subscribe((obj) => {
      // if the subject changes the object will be synced with yjs
      this.logger.debug(
        'Syncing local object with remote y-js map...',
      );
      this._syncObjectToMap(
        cloneDeep(obj),
        map,
        initializedSubject.getValue(),
      );
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

  /**
   * Recursively updates the values in the shared map to the changes made to the local object
   * @param obj The local object from which we want to update the changes
   * @param map our yjs map
   * @param init true if the local object has been initialized yet
   * @returns true if successfull
   */
  private _syncObjectToMap(
    obj: object,
    map: Map<any>,
    init?: boolean,
  ) {
    try {
      const mapAsObj = map.toJSON();
      if (isEqual(obj, mapAsObj)) {
        return true;
      }
      if (!init) {
        // delete elements that are present in the map but not in the object.
        // Dont delete them on first sync to prevent deleting other workspaces
        const deletedKeys = Object.keys(mapAsObj).filter(
          (key) => !Object.keys(obj).includes(key),
        );
        deletedKeys.map((deletedKey) => map.delete(deletedKey));
      }
      // sync elements from object to map
      for (const key of Object.keys(obj)) {
        const objValue = obj[key];
        let mapValue = map.get(key);
        if (isEqual(objValue, mapValue)) {
          continue;
        }
        // use YMap if value is an object and use the value itself otherwise
        if (isPlainObject(objValue)) {
          if (!(mapValue instanceof Map)) {
            map.set(key, new Map());
            mapValue = map.get(key);
          }
          return this._syncObjectToMap(objValue, mapValue);
        } else {
          if (objValue !== null) {
            map.set(key, JSON.parse(JSON.stringify(objValue))); // make sure to set only objects which can be parsed as JSON
          }
        }
      }
    } catch (error) {
      console.error(error);
      return false;
    }
  }
}
