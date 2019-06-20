import {Injectable} from '@angular/core';
import {environment} from '../environments/environment';
import {NGXLogger} from 'ngx-logger';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {merge} from 'lodash';

export interface SuccessModel {
  xml: string;
}

export interface MeasureCatalog {
  xml: string;
}

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

  constructor(private http: HttpClient, private logger: NGXLogger) {
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

  async makeRequest<T>(url: string, options: {
    method?: string; headers?: {
      [header: string]: string | string[];
    }; body?: string
  } = {}) {
    options = merge({
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'accept-language': 'en-US',
      }
    }, options);
    if (this.userCredentials) {
      const username = this.userCredentials.user;
      const password = this.userCredentials.password;
      const token = this.userCredentials.token;
      options = merge(options, {
        headers: {
          Authorization: 'Basic ' + btoa(username + ':' + password),
          access_token: token,
        }
      });
    }
    this.logger.debug('Fetching from ' + url + ' with options ' + JSON.stringify(options));
    const ngHttpOptions: {
      body?: any;
      headers?: HttpHeaders | {
        [header: string]: string | string[];
      };
      observe?: 'body';
      params?: HttpParams | {
        [param: string]: string | string[];
      };
      responseType?: 'json';
      reportProgress?: boolean;
      withCredentials?: boolean;
    } = {};
    if (options.headers) {
      ngHttpOptions.headers = new HttpHeaders(options.headers);
    }
    if (options.body) {
      ngHttpOptions.body = options.body;
    }
    return this.http.request<T>(options.method, url, ngHttpOptions).toPromise();
  }

  async fetchServicesFromDiscovery() {
    const url = Las2peerService.joinAbsoluteUrlPath(environment.las2peerWebConnectorUrl, this.SERVICES_PATH);
    return this.makeRequest(url)
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
      .catch((response) => this.logger.error('Could not fetch services from service MobSOS:'
        + JSON.stringify(response)));
  }

  async fetchContactServiceGroups() {
    const url = Las2peerService.joinAbsoluteUrlPath(environment.las2peerWebConnectorUrl, this.CONTACT_SERVICE_PATH,
      this.CONTACT_GROUPS_PATH);
    return this.makeRequest(url)
      .catch((response) => this.logger.error(response));
  }

  async fetchMobSOSGroups() {
    const url = Las2peerService.joinAbsoluteUrlPath(environment.las2peerWebConnectorUrl,
      this.SUCCESS_MODELING_SERVICE_PATH, this.SUCCESS_MODELING_GROUP_PATH);
    return this.makeRequest(url);
  }

  async fetchMobSOSGroup(groupID: string) {
    const url = Las2peerService.joinAbsoluteUrlPath(environment.las2peerWebConnectorUrl,
      this.SUCCESS_MODELING_SERVICE_PATH, this.SUCCESS_MODELING_GROUP_PATH, groupID);
    return this.makeRequest(url);
  }

  async fetchSuccessModel(groupID: string, service: string) {
    const url = Las2peerService.joinAbsoluteUrlPath(environment.las2peerWebConnectorUrl,
      this.SUCCESS_MODELING_SERVICE_PATH, this.SUCCESS_MODELING_MODELS_PATH, groupID, service);
    return new Promise((resolve, reject) => {
      this.makeRequest<SuccessModel>(url)
        .then((response) => resolve(response.xml))
        .catch((response) => {
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

    return this.makeRequest(url, {method, body: JSON.stringify({groupID, name: groupName})})

      .catch((response) => {
        this.logger.error(response);
        throw response;
      });
  }

  async saveSuccessModel(groupID: string, service: string, xml: string) {
    let method;
    try {
      await this.fetchSuccessModel(groupID, service);
      method = 'PUT';
    } catch (e) {
      method = 'POST';
    }

    const url = Las2peerService.joinAbsoluteUrlPath(environment.las2peerWebConnectorUrl, this.SUCCESS_MODELING_SERVICE_PATH,
      this.SUCCESS_MODELING_MODELS_PATH, groupID, service);
    return this.makeRequest<SuccessModel>(url, {method, body: JSON.stringify({xml})})
      .then((response) => response.xml)
      .catch((response) => {
        this.logger.error(response);
        throw response;
      });
  }

  async fetchMeasureCatalog(groupID: string) {
    const url = Las2peerService.joinAbsoluteUrlPath(environment.las2peerWebConnectorUrl, this.SUCCESS_MODELING_SERVICE_PATH,
      this.SUCCESS_MODELING_MEASURE_PATH, groupID);
    return this.makeRequest<MeasureCatalog>(url)
      .then((response) => response.xml)
      .catch((response) => {
        throw response;
      });
  }

  async saveMeasureCatalog(groupID: string, xml: string) {
    let method;
    try {
      await this.fetchMeasureCatalog(groupID);
      method = 'PUT';
    } catch (e) {
      method = 'POST';
    }

    const url = Las2peerService.joinAbsoluteUrlPath(environment.las2peerWebConnectorUrl, this.SUCCESS_MODELING_SERVICE_PATH,
      this.SUCCESS_MODELING_MEASURE_PATH, groupID);
    return this.makeRequest<MeasureCatalog>(url, {method, body: JSON.stringify({xml})})
      .then((response) => response.xml)
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
    return this.makeRequest(url, {method: 'POST', body: JSON.stringify(requestBody)}).catch((response) => {
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
