import {Injectable} from '@angular/core';
import {environment} from '../environments/environment';
import {NGXLogger} from 'ngx-logger';

@Injectable({
  providedIn: 'root'
})
export class Las2peerService {

  constructor(private logger: NGXLogger) {
  }

  SERVICES_PATH = 'las2peer/services/services';
  CONTACT_SERVICE_PATH = 'contactservice';
  CONTACT_GROUPS_PATH = 'groups';

  userCredentials;

  static joinAbsoluteUrlPath(...args) {
    return args.map(pathPart => pathPart.replace(/(^\/|\/$)/g, '')).join('/');
  }

  setCredentials(username, password, accessToken) {
    this.userCredentials = {user: username, password, token: accessToken};
  }

  resetCredentials() {
    this.userCredentials = null;
  }

  async fetchWithCredentials(url, init = {}) {
    let credentialOptions = {};
    if (this.userCredentials) {
      const username = this.userCredentials.user;
      const password = this.userCredentials.password;
      const token = this.userCredentials.token;
      credentialOptions = {
        headers: {
          Authorization: 'Basic ' + btoa(username + ':' + password),
          access_token: token,
        }
      };
    }
    const options = Object.assign(credentialOptions, init);
    this.logger.debug('Fetching from ' + url + ' with options ' + JSON.stringify(options));
    return fetch(url, options);
  }

  async fetchServices() {
    this.logger.debug('Fetching services');
    const url = Las2peerService.joinAbsoluteUrlPath(environment.las2peerWebConnectorUrl, this.SERVICES_PATH);
    return this.fetchWithCredentials(url).then((response) => response.json().catch((response2) => this.logger.error(response2)));
  }

  async fetchGroups() {
    const url = Las2peerService.joinAbsoluteUrlPath(environment.las2peerWebConnectorUrl, this.CONTACT_SERVICE_PATH, this.CONTACT_GROUPS_PATH);
    return this.fetchWithCredentials(url).then((response) => response.json().catch((response2) => this.logger.error(response2)));
  }

  pollServices(successCallback, failureCallback) {
    return setInterval(
      () => this.fetchServices().then((response) => {
        successCallback(response);
      })
        .catch((error) => failureCallback(error)),
      environment.servicePollingInterval * 1000);
  }

  pollGroups(successCallback, failureCallback) {
    return setInterval(
      () => this.fetchGroups().then((response) => {
        successCallback(response);
      })
        .catch((error) => failureCallback(error)),
      environment.servicePollingInterval * 1000);
  }
}
