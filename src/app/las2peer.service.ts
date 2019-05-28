import {Injectable} from '@angular/core';
import {environment} from '../environments/environment';
import {NGXLogger} from 'ngx-logger';

@Injectable({
  providedIn: 'root'
})
export class Las2peerService {

  SERVICES_PATH = 'las2peer/services/services';
  CONTACT_SERVICE_PATH = 'contactservice';
  CONTACT_GROUPS_PATH = 'groups';
  SUCCESS_MODELING_SERVICE_PATH = 'mobsos-success-modeling/apiv2';
  SUCCESS_MODELING_MODELS_PATH = 'models';
  SUCCESS_MODELING_MEASURE_PATH = 'measures';
  SUCCESS_MODELING_SERVICE_DISCOVERY_PATH = 'services';
  SUCCESS_MODELING_GROUP_PATH = 'groups';
  QUERY_VISUALIZATION_SERVICE_PATH = 'QVS';
  QUERY_VISUALIZATION_VISUALIZE_QUERY_PATH = '/query/visualize';
  userCredentials;

  constructor(private logger: NGXLogger) {
  }

  static joinAbsoluteUrlPath(...args) {
    return args.map(pathPart => pathPart.replace(/(^\/|\/$)/g, '')).join('/');
  }

  setCredentials(username, password, accessToken) {
    this.userCredentials = {user: username, password, token: accessToken};
  }

  resetCredentials() {
    this.userCredentials = null;
  }

  async makeRequest(url, init = {}) {
    let credentialOptions = {};
    if (this.userCredentials) {
      const username = this.userCredentials.user;
      const password = this.userCredentials.password;
      const token = this.userCredentials.token;
      credentialOptions = {
        headers: {
          Authorization: 'Basic ' + btoa(username + ':' + password),
          access_token: token,
          "Content-Type": "application/json",
        }
      };
    }
    const options = Object.assign(credentialOptions, init);
    this.logger.debug('Fetching from ' + url + ' with options ' + JSON.stringify(options));
    return new Promise<Response>((resolve, reject) => {
      fetch(url, options).then((response) => {
        if (response.ok) {
          resolve(response);
        } else {
          reject(response);
        }
      }).catch(reject);
    });
  }

  async fetchServicesFromDiscovery() {
    const url = Las2peerService.joinAbsoluteUrlPath(environment.las2peerWebConnectorUrl, this.SERVICES_PATH);
    return this.makeRequest(url)
      .then((response) => response.json())
      .catch((response) => this.logger.error('Could not fetch services from service discovery:'
        + JSON.stringify(response)));
  }

  async fetchServicesFromMobSOS() {
    const url = Las2peerService.joinAbsoluteUrlPath(
      environment.las2peerWebConnectorUrl,
      this.SUCCESS_MODELING_SERVICE_PATH,
      this.SUCCESS_MODELING_SERVICE_DISCOVERY_PATH
    );
    return this.makeRequest(url)
      .then((response) => response.json())
      .catch((response) => this.logger.error('Could not fetch services from service MobSOS:'
        + JSON.stringify(response)));
  }

  async fetchContactServiceGroups() {
    const url = Las2peerService.joinAbsoluteUrlPath(environment.las2peerWebConnectorUrl, this.CONTACT_SERVICE_PATH,
      this.CONTACT_GROUPS_PATH);
    return this.makeRequest(url)
      .then((response) => response.json())
      .catch((response) => this.logger.error(response));
  }

  async fetchMobSOSGroups() {
    const url = Las2peerService.joinAbsoluteUrlPath(environment.las2peerWebConnectorUrl,
      this.SUCCESS_MODELING_SERVICE_PATH, this.SUCCESS_MODELING_GROUP_PATH);
    return this.makeRequest(url)
      .then((response) => response.json());
  }

  async fetchMobSOSGroup(groupID: string) {
    const url = Las2peerService.joinAbsoluteUrlPath(environment.las2peerWebConnectorUrl,
      this.SUCCESS_MODELING_SERVICE_PATH, this.SUCCESS_MODELING_GROUP_PATH, groupID);
    return this.makeRequest(url)
      .then((response) => response.json());
  }

  async fetchSuccessModel(groupID: string, service: string) {
    const url = Las2peerService.joinAbsoluteUrlPath(environment.las2peerWebConnectorUrl,
      this.SUCCESS_MODELING_SERVICE_PATH, this.SUCCESS_MODELING_MODELS_PATH, groupID, service);
    return new Promise((resolve, reject) => {
      this.makeRequest(url)
        .then((response) => response.json().then(json => resolve(json.xml)))
        .catch((response) => {
          this.logger.error(response);
          reject(response);
        });
    });
  }

  async saveGroupToMobSOS(groupID: string, groupName: string) {
    let method;
    let url;
    try {
      await this.fetchMobSOSGroup(groupID);
      method = 'PUT';
      url = Las2peerService.joinAbsoluteUrlPath(environment.las2peerWebConnectorUrl,
        this.SUCCESS_MODELING_SERVICE_PATH, this.SUCCESS_MODELING_GROUP_PATH, groupID);
    } catch (e) {
      method = 'POST';
      url = Las2peerService.joinAbsoluteUrlPath(environment.las2peerWebConnectorUrl,
        this.SUCCESS_MODELING_SERVICE_PATH, this.SUCCESS_MODELING_GROUP_PATH);
    }

    return this.makeRequest(url, {method: method, body: JSON.stringify({groupID, name: groupName})})
      .then((response) => response.json())
      .catch((response) => {
        this.logger.error(response);
        throw response;
      });
  }

  async saveSuccessModel(groupID: string, service: string, xml: string) {
    let method;
    try {
      const reponse = await this.fetchSuccessModel(groupID, service);
      method = 'PUT';
    } catch (e) {
      method = 'POST';
    }

    const url = Las2peerService.joinAbsoluteUrlPath(environment.las2peerWebConnectorUrl, this.SUCCESS_MODELING_SERVICE_PATH,
      this.SUCCESS_MODELING_MODELS_PATH, groupID, service);
    return this.makeRequest(url, {method: method, body: JSON.stringify({xml: xml})})
      .then((response) => response.json().then(json => json.xml))
      .catch((response) => {
        this.logger.error(response);
        throw response;
      });
  }

  async fetchMeasureCatalog(groupID: string) {
    const url = Las2peerService.joinAbsoluteUrlPath(environment.las2peerWebConnectorUrl, this.SUCCESS_MODELING_SERVICE_PATH,
      this.SUCCESS_MODELING_MEASURE_PATH, groupID);
    return this.makeRequest(url)
      .then((response) => response.json().then(json => json.xml))
      .catch((response) => {
        this.logger.error(response);
        throw response
      });
  }

  async saveMeasureCatalog(groupID: string, xml: string) {
    let method;
    try {
      const response = await this.fetchMeasureCatalog(groupID);
      method = 'PUT';
    } catch (e) {
      method = 'POST';
    }

    const url = Las2peerService.joinAbsoluteUrlPath(environment.las2peerWebConnectorUrl, this.SUCCESS_MODELING_SERVICE_PATH,
      this.SUCCESS_MODELING_MEASURE_PATH, groupID);
    return this.makeRequest(url, {method: method, body: JSON.stringify({xml: xml})})
      .then((response) => response.json().then(json => json.xml))
      .catch((response) => {
        this.logger.error(response);
        throw response;
      });
  }

  async visualizeQuery(query: string, queryParams: string[], format: string = 'JSON') {
    const url = Las2peerService.joinAbsoluteUrlPath(environment.las2peerWebConnectorUrl,
      this.QUERY_VISUALIZATION_SERVICE_PATH, this.QUERY_VISUALIZATION_VISUALIZE_QUERY_PATH, `?format=${format}`);
    const requestBody = {
      cache: false, dbkey: '__mobsos', height: '200px', width: '300px', modtypei: null, query,
      queryparams: queryParams, title: '', save: false
    };
    return this.makeRequest(url, {method: 'POST', body: JSON.stringify(requestBody)})
      .then((response) => {
        return response.body.getReader().read().then(({done, value}) => new TextDecoder("utf-8").decode(value))
      })
      .catch((response) => {
        this.logger.error(response);
        throw response;
      });
  }

  pollL2PServiceDiscovery(successCallback, failureCallback) {
    return setInterval(
      () => this.fetchServicesFromDiscovery().then((response) => {
        successCallback(response);
      })
        .catch((error) => failureCallback(error)),
      environment.servicePollingInterval * 1000);
  }

  pollMobSOSServiceDiscovery(successCallback, failureCallback) {
    return setInterval(
      () => this.fetchServicesFromMobSOS().then((response) => {
        successCallback(response);
      })
        .catch((error) => failureCallback(error)),
      environment.servicePollingInterval * 1000);
  }

  pollContactServiceGroups(successCallback, failureCallback) {
    return setInterval(
      () => this.fetchContactServiceGroups().then((response) => {
        successCallback(response);
      })
        .catch((error) => failureCallback(error)),
      environment.servicePollingInterval * 1000);
  }

  pollMobSOSGroups(successCallback, failureCallback) {
    return setInterval(
      () => this.fetchMobSOSGroups().then((response) => {
        successCallback(response);
      })
        .catch((error) => failureCallback(error)),
      environment.servicePollingInterval * 1000);
  }
}
