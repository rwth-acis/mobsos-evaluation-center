import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {NGXLogger} from 'ngx-logger';
import {Las2peerService} from './las2peer.service';
import {throttle} from 'lodash-es';
import {distinctUntilChanged} from 'rxjs/operators';

export interface State {
  services: object[];
  groups: object;
  user: object;
}


@Injectable({
  providedIn: 'root'
})
export class StoreService {

  constructor(private logger: NGXLogger, private las2peer: Las2peerService) {
    const previousState = StoreService.loadState();
    if (previousState !== null) {
      this.servicesSubject.next(previousState.services);
      this.groupsSubject.next(previousState.groups);
      this.userSubject.next(previousState.user);
    }
    const throtteledSaveStateFunc = throttle(() => this.saveState(), 1000);
    this.services.pipe(distinctUntilChanged()).subscribe(() => throtteledSaveStateFunc());
    this.groups.pipe(distinctUntilChanged()).subscribe(() => throtteledSaveStateFunc());
    this.user.pipe(distinctUntilChanged()).subscribe((user) => {
      if (user) {
        this.las2peer.setCredentials(user.profile.preferred_username, user.profile.sub, user.access_token);
      } else {
        this.las2peer.resetCredentials();
      }
      throtteledSaveStateFunc();
    });
  }

  pollingEnabled = false;
  servicePollingHandle;
  groupPollingHandle;
  servicesSubject = new BehaviorSubject([]);
  public services = this.servicesSubject.asObservable();
  groupsSubject = new BehaviorSubject({});
  public groups = this.groupsSubject.asObservable();
  userSubject = new BehaviorSubject(null);
  public user = this.userSubject.asObservable();

  static loadState(): State {
    return JSON.parse(localStorage.getItem('state'));
  }

  startPolling() {
    if (!this.pollingEnabled) {
      this.logger.debug('Enabling service discovery and group polling...');
      this.servicePollingHandle = this.las2peer.pollServices(
        (services) => this.servicesSubject.next(services),
        () => {
        }
      );
      this.groupPollingHandle = this.las2peer.pollGroups(
        (groups) => this.groupsSubject.next(groups),
        () => {
        }
      );
      this.pollingEnabled = true;
    } else {
      this.logger.debug('Polling already enabled...');
    }
  }

  stopPolling() {
    clearInterval(this.servicePollingHandle);
    clearInterval(this.groupPollingHandle);
    this.servicePollingHandle = null;
    this.groupPollingHandle = null;
    this.pollingEnabled = false;
  }

  saveState() {
    try {
      const serializedState = JSON.stringify({
        services: this.servicesSubject.getValue(), groups: this.groupsSubject.getValue(),
        user: this.userSubject.getValue()
      });
      this.logger.debug('Save state to local storage: ' + serializedState);
      localStorage.setItem('state', serializedState);
    } catch (err) {
      // ignore write errors
    }
  }

  setUser(user) {
    this.userSubject.next(user);
  }
}
