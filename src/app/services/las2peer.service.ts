/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { Injectable } from '@angular/core';

import {
  HttpClient,
  HttpHeaders,
  HttpParams,
} from '@angular/common/http';
import { forkJoin, Observable, of } from 'rxjs';
import {
  catchError,
  map,
  share,
  switchMap,
  timeout,
} from 'rxjs/operators';
import { merge, cloneDeep } from 'lodash-es';
import { environment } from 'src/environments/environment';
import { SuccessModel } from '../models/success.model';
import { IQuestionnaire } from '../models/questionnaire.model';
import { Requirement } from '../models/reqbaz.model';
interface HttpOptions {
  method?: string;
  headers?: {
    [header: string]: string | string[];
  };
  body?: string;
  responseType?: 'arraybuffer' | 'blob' | 'json' | 'text';
  observe?: 'body' | 'events' | 'response';
}

@Injectable({
  providedIn: 'root',
})
export class Las2peerService {
  SERVICES_PATH = 'las2peer/services/services';
  CONTACT_SERVICE_PATH = 'contactservice';
  CONTACT_GROUPS_PATH = 'groups';
  SUCCESS_MODELING_SERVICE_PATH = 'mobsos-success-modeling/apiv2';
  SUCCESS_MODELING_MODELS_PATH = 'models';
  SUCCESS_MODELING_MEASURE_PATH = 'measures';
  SUCCESS_MODELING_MESSAGE_DESCRIPTION_PATH = 'messageDescriptions';
  SUCCESS_MODELING_SERVICE_DISCOVERY_PATH = 'services';
  SUCCESS_MODELING_GROUP_PATH = 'groups';
  QUERY_VISUALIZATION_SERVICE_PATH = 'QVS';
  QUERY_VISUALIZATION_VISUALIZE_QUERY_PATH = '/query/visualize';
  REQBAZ_PROJECTS_PATH = 'projects';
  REQBAZ_CATEGORIES_PATH = 'categories';
  REQBAZ_REQUIREMENTS_PATH = 'requirements';
  REQBAZ_REALIZED_PATH = 'realized';
  REQBAZ_LEADDEV_PATH = 'leaddevelopers';
  SURVEYS_SERVICE_PATH = 'mobsos-surveys';
  SURVEYS_QUESTIONNAIRES_PATH = 'questionnaires';
  SURVEYS_SURVEY_PATH = 'surveys';
  SURVEYS_SURVEY_QUESTIONNAIRE_SUFFIX = 'questionnaire';
  SURVEYS_QUESTIONNAIRE_FORM_SUFFIX = 'form';
  userCredentials: { token: string; preferred_username: string };

  constructor(private http: HttpClient) {}

  setCredentials(
    username: string,
    password: string,
    accessToken: string,
  ): void {
    this.userCredentials = {
      preferred_username: username,
      // password,
      token: accessToken,
    };
  }

  resetCredentials(): void {
    this.userCredentials = null;
  }

  async makeRequest<T>(
    url: string,
    options: HttpOptions = {},
  ): Promise<T> {
    options = merge(
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'accept-language': 'en-US',
        },
      },
      options,
    ) as HttpOptions;

    this.userCredentials = JSON.parse(
      localStorage.getItem('profile'),
    );
    const username = this.userCredentials?.preferred_username;
    const sub = JSON.parse(localStorage.getItem('profile'))
      ?.sub as string;
    const token = localStorage.getItem('access_token');
    if (username) {
      options.headers.Authorization =
        'Basic ' + btoa(`${username}:${sub}`);
      options.headers.access_token = token;
    }

    const ngHttpOptions: {
      body?: any;
      headers?:
        | HttpHeaders
        | {
            [header: string]: string | string[];
          };
      observe?: 'body';
      params?:
        | HttpParams
        | {
            [param: string]: string | string[];
          };
      responseType?: 'arraybuffer' | 'blob' | 'json' | 'text';
      reportProgress?: boolean;
      withCredentials?: boolean;
    } = {};
    if (options.headers) {
      ngHttpOptions.headers = new HttpHeaders(options.headers);
    }
    if (options.body) {
      ngHttpOptions.body = options.body;
    }
    if (options.responseType) {
      ngHttpOptions.responseType = options.responseType;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.http
      .request(options.method, url, ngHttpOptions)
      .pipe(share())
      .toPromise();
  }

  makeRequestAndObserve<T>(
    url: string,
    options: HttpOptions = {},
  ): Observable<T | Request | any> {
    options = merge(
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'accept-language': 'en-US',
        },
      },
      options,
    );

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.userCredentials = JSON.parse(
      localStorage.getItem('profile'),
    );
    const username = this.userCredentials?.preferred_username;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const sub = JSON.parse(localStorage.getItem('profile'))
      ?.sub as string;
    const token = localStorage.getItem('access_token');
    if (username) {
      options.headers.Authorization =
        'Basic ' + btoa(`${username}:${sub}`);
      options.headers.access_token = token;
    }

    const ngHttpOptions = {};

    if (options.headers) {
      ngHttpOptions['headers'] = new HttpHeaders(options.headers);
    }
    if (options.body) {
      ngHttpOptions['body'] = options.body;
    }
    if (options.responseType) {
      ngHttpOptions['responseType'] = options.responseType;
    }

    let ngHttpOptionsNoAuthorization = cloneDeep(ngHttpOptions);
    ngHttpOptionsNoAuthorization['headers'] = new HttpHeaders({
      ...options.headers,
      Authorization: '',
      access_token: '',
    });

    return this.http
      .request(options.method, url, ngHttpOptions)
      .pipe(
        catchError((err) =>
          err.status === 401 && err.error === 'agent not found'
            ? this.http.request(
                options.method,
                url,
                ngHttpOptionsNoAuthorization,
              )
            : of(err),
        ),
      );
  }

  fetchServicesFromDiscoveryAndObserve(): Observable<any> {
    if (!environment.useLas2peerServiceDiscovery)
      return of(undefined);
    const url = joinAbsoluteUrlPath(
      environment.las2peerWebConnectorUrl,
      this.SERVICES_PATH,
    );
    return this.makeRequestAndObserve(url);
  }

  addGroup(groupName: string): Observable<any> {
    const url = joinAbsoluteUrlPath(
      environment.las2peerWebConnectorUrl,
      this.CONTACT_SERVICE_PATH,
      this.CONTACT_GROUPS_PATH,
      groupName,
    );
    return this.makeRequestAndObserve(url, {
      method: 'POST',
      responseType: 'text',
    });
  }

  fetchServicesFromMobSOSAndObserve(): Observable<any> {
    const url = joinAbsoluteUrlPath(
      environment.las2peerWebConnectorUrl,
      this.SUCCESS_MODELING_SERVICE_PATH,
      this.SUCCESS_MODELING_SERVICE_DISCOVERY_PATH,
    );
    return this.makeRequestAndObserve(url);
  }

  async fetchContactServiceGroups() {
    return this.fetchContactServiceGroupsAndObserve()
      .toPromise()
      .catch((response) => console.error(response));
  }

  fetchMobSOSGroupsAndObserve() {
    const url = joinAbsoluteUrlPath(
      environment.las2peerWebConnectorUrl,
      this.SUCCESS_MODELING_SERVICE_PATH,
      this.SUCCESS_MODELING_GROUP_PATH,
    );
    return this.makeRequestAndObserve(url);
  }

  fetchContactServiceGroupsAndObserve() {
    const url = joinAbsoluteUrlPath(
      environment.las2peerWebConnectorUrl,
      this.CONTACT_SERVICE_PATH,
      this.CONTACT_GROUPS_PATH,
    );
    return this.makeRequestAndObserve(url);
  }

  async fetchMobSOSGroups(): Promise<[]> {
    const url = joinAbsoluteUrlPath(
      environment.las2peerWebConnectorUrl,
      this.SUCCESS_MODELING_SERVICE_PATH,
      this.SUCCESS_MODELING_GROUP_PATH,
    );
    return this.makeRequest(url);
  }

  async fetchMobSOSGroup(groupID: string) {
    const url = joinAbsoluteUrlPath(
      environment.las2peerWebConnectorUrl,
      this.SUCCESS_MODELING_SERVICE_PATH,
      this.SUCCESS_MODELING_GROUP_PATH,
      groupID,
    );
    return this.makeRequest(url);
  }

  async fetchSuccessModel(groupID: string, service: string) {
    const url = joinAbsoluteUrlPath(
      environment.las2peerWebConnectorUrl,
      this.SUCCESS_MODELING_SERVICE_PATH,
      this.SUCCESS_MODELING_MODELS_PATH,
      groupID,
      service,
    );
    return new Promise((resolve, reject) => {
      this.makeRequest<{ xml: string }>(url)
        .then((response) => resolve(response.xml))
        .catch((response) => {
          reject(response);
        });
    });
  }

  fetchSuccessModelAsObservable(groupID: string, service: string) {
    if (!service || !groupID) {
      console.error('Service or group not specified!');
      return of(undefined);
    }
    const url = joinAbsoluteUrlPath(
      environment.las2peerWebConnectorUrl,
      this.SUCCESS_MODELING_SERVICE_PATH,
      this.SUCCESS_MODELING_MODELS_PATH,
      groupID,
      service,
    );
    return this.makeRequestAndObserve<SuccessModel>(url).pipe(
      map((response: { xml: string }) => response.xml),
    );
  }

  checkIfSuccessModelPresent(groupID: string, service: string) {
    const url = joinAbsoluteUrlPath(
      environment.las2peerWebConnectorUrl,
      this.SUCCESS_MODELING_SERVICE_PATH,
      this.SUCCESS_MODELING_MODELS_PATH,
      groupID,
      service,
    );
    return this.makeRequestAndObserve<SuccessModel>(url, {
      observe: 'response',
    }).pipe(
      map((response) => !!response),
      catchError(() => of(false)),
    );
  }

  async fetchMobSOSQuestionnaires() {
    const url = joinAbsoluteUrlPath(
      environment.mobsosSurveysUrl,
      this.SURVEYS_QUESTIONNAIRES_PATH,
      '?full=1',
    );
    return this.makeRequest<{ questionnaires: IQuestionnaire[] }>(url)
      .then((response) =>
        this.fetchQuestionnaireForms(response.questionnaires),
      )
      .then((response) => {
        for (const questionnaire of response) {
          questionnaire.name = decodeURIComponent(questionnaire.name);
          questionnaire.description = decodeURIComponent(
            questionnaire.description,
          );
        }
        return response;
      });
  }

  fetchMobSOSQuestionnairesAndObserve() {
    const url = joinAbsoluteUrlPath(
      environment.mobsosSurveysUrl,
      this.SURVEYS_QUESTIONNAIRES_PATH,
      '?full=1',
    );
    return this.makeRequestAndObserve<IQuestionnaire[]>(url).pipe(
      map((response) => [response, response]),
      switchMap(([questionnaires, response]) => [
        questionnaires,
        this.fetchQuestionnaireFormsAndObserve(
          response.questionnaires,
        ),
      ]),
      map(([questionnaires, forms]: [IQuestionnaire[], string[]]) => {
        for (let index = 0; index < questionnaires.length; index++) {
          const questionnaire = questionnaires[index];
          questionnaire.name = decodeURIComponent(questionnaire.name);
          questionnaire.description = decodeURIComponent(
            questionnaire.description,
          );
          questionnaire.formXML = forms[index];
        }

        return questionnaires as IQuestionnaire[];
      }),
      timeout(60000),
    );
  }
  async fetchQuestionnaireForms(questionnaires: IQuestionnaire[]) {
    for (const questionnaire of questionnaires) {
      const formUrl = joinAbsoluteUrlPath(
        environment.mobsosSurveysUrl,
        this.SURVEYS_QUESTIONNAIRES_PATH,
        questionnaire.id,
        this.SURVEYS_QUESTIONNAIRE_FORM_SUFFIX,
      );
      questionnaire.formXML = await this.makeRequest<string>(
        formUrl,
        {
          responseType: 'text',
        },
      );
    }
    return questionnaires;
  }

  fetchQuestionnaireFormsAndObserve(
    questionnaires: IQuestionnaire[],
  ) {
    const questionaireFormRequests = questionnaires.map(
      (questionnaire) => {
        const formUrl = joinAbsoluteUrlPath(
          environment.mobsosSurveysUrl,
          this.SURVEYS_QUESTIONNAIRES_PATH,
          questionnaire.id,
          this.SURVEYS_QUESTIONNAIRE_FORM_SUFFIX,
        );
        return this.makeRequestAndObserve<string>(formUrl, {
          responseType: 'text',
        });
      },
    );
    return forkJoin(questionaireFormRequests);
  }
  async createSurvey(
    name: string,
    description: string,
    organization: string,
    logo: string,
    start: string,
    end: string,
    resource: string,
    resourceLabel: string,
    lang: string,
  ) {
    const url = joinAbsoluteUrlPath(
      environment.mobsosSurveysUrl,
      this.SURVEYS_SURVEY_PATH,
    );
    return this.makeRequest(url, {
      method: 'POST',
      body: JSON.stringify({
        name,
        description,
        organization,
        logo,
        start,
        end,
        resource,
        'resource-label': resourceLabel,
        lang,
      }),
    });
  }

  async setQuestionnaireForSurvey(
    questionnaireId: number,
    surveyId: number,
  ) {
    const url = joinAbsoluteUrlPath(
      environment.mobsosSurveysUrl,
      this.SURVEYS_SURVEY_PATH,
      surveyId,
      this.SURVEYS_SURVEY_QUESTIONNAIRE_SUFFIX,
    );
    return this.makeRequest(url, {
      method: 'POST',
      body: JSON.stringify({ qid: questionnaireId }),
      responseType: 'text',
    });
  }

  async deleteSurvey(surveyId: number) {
    const url = joinAbsoluteUrlPath(
      environment.mobsosSurveysUrl,
      this.SURVEYS_SURVEY_PATH,
      surveyId,
    );
    return this.makeRequest(url, {
      method: 'DELETE',
      responseType: 'text',
    });
  }
  /**
   * @deprecated MobSOS groups might be outdated. We should not rely on them.
   * Thus there is no need to transfer groups from the contact service to mobsos
   */
  async saveGroupToMobSOS(groupID: string, groupName: string) {
    let method;
    let url;
    try {
      await this.fetchMobSOSGroup(groupID);
      method = 'PUT';
      url = joinAbsoluteUrlPath(
        environment.las2peerWebConnectorUrl,
        this.SUCCESS_MODELING_SERVICE_PATH,
        this.SUCCESS_MODELING_GROUP_PATH,
        groupID,
      );
    } catch (e) {
      method = 'POST';
      url = joinAbsoluteUrlPath(
        environment.las2peerWebConnectorUrl,
        this.SUCCESS_MODELING_SERVICE_PATH,
        this.SUCCESS_MODELING_GROUP_PATH,
      );
    }

    return this.makeRequest(url, {
      method,
      body: JSON.stringify({ groupID, name: groupName }),
    }).catch((response) => {
      console.error(response);
      throw response;
    });
  }
  /**
   * @deprecated MobSOS groups might be outdated. We should not rely on them.
   * Thus there is no need to transfer groups from the contact service to mobsos
   */
  saveGroupsToMobSOS(groups) {
    const method = 'POST';
    const url = joinAbsoluteUrlPath(
      environment.las2peerWebConnectorUrl,
      this.SUCCESS_MODELING_SERVICE_PATH,
      this.SUCCESS_MODELING_GROUP_PATH,
    );
    return forkJoin(
      groups.map((group) =>
        this.makeRequestAndObserve(url, {
          method,
          body: JSON.stringify({
            groupID: group.id,
            name: group.groupName,
          }),
        }),
      ),
    );
  }

  async saveSuccessModel(
    groupID: string,
    service: string,
    xml: string,
  ) {
    let method;
    try {
      await this.fetchSuccessModel(groupID, service);
      method = 'PUT';
    } catch (e) {
      method = 'POST';
    }

    const url = joinAbsoluteUrlPath(
      environment.las2peerWebConnectorUrl,
      this.SUCCESS_MODELING_SERVICE_PATH,
      this.SUCCESS_MODELING_MODELS_PATH,
      groupID,
      service,
    );
    return this.makeRequest<{ xml: string }>(url, {
      method,
      body: JSON.stringify({ xml }),
    })
      .then((response) => response.xml)
      .catch((response) => {
        console.error(response);
        throw response;
      });
  }

  saveSuccessModelAndObserve(
    groupID: string,
    service: string,
    xml: string,
  ) {
    const url = joinAbsoluteUrlPath(
      environment.las2peerWebConnectorUrl,
      this.SUCCESS_MODELING_SERVICE_PATH,
      this.SUCCESS_MODELING_MODELS_PATH,
      groupID,
      service,
    );
    return this.makeRequestAndObserve<SuccessModel>(url, {
      method: 'PUT',
      body: JSON.stringify({ xml }),
      observe: 'response',
    });
  }

  async fetchMeasureCatalog(groupID: string) {
    const url = joinAbsoluteUrlPath(
      environment.las2peerWebConnectorUrl,
      this.SUCCESS_MODELING_SERVICE_PATH,
      this.SUCCESS_MODELING_MEASURE_PATH,
      groupID,
    );
    return this.makeRequest<{ xml: string }>(url)
      .then((response) => response?.xml)
      .catch((response) => {
        throw response;
      });
  }

  fetchMeasureCatalogAsObservable(
    groupID: string,
  ): Observable<string> {
    const url = joinAbsoluteUrlPath(
      environment.las2peerWebConnectorUrl,
      this.SUCCESS_MODELING_SERVICE_PATH,
      this.SUCCESS_MODELING_MEASURE_PATH,
      groupID,
    );
    const req = this.makeRequestAndObserve<{ xml: string }>(url, {
      observe: 'body',
    }).pipe(
      map((response: { xml?: string }) =>
        response ? response.xml : null,
      ),
    );
    req.subscribe(() => {});

    return req;
  }

  checkIfMeasureCatalogPresent(groupID: string): Observable<boolean> {
    const url = joinAbsoluteUrlPath(
      environment.las2peerWebConnectorUrl,
      this.SUCCESS_MODELING_SERVICE_PATH,
      this.SUCCESS_MODELING_MEASURE_PATH,
      groupID,
    );
    const req = this.makeRequestAndObserve<{ xml: string }>(url, {
      observe: 'response',
    });
    return req.pipe(
      map(
        (response) => !!response,
        () => false,
      ),
      catchError(() => of(false)),
    );
  }

  async saveMeasureCatalog(groupID: string, xml: string) {
    let method;
    try {
      await this.fetchMeasureCatalog(groupID);
      method = 'PUT';
    } catch (e) {
      method = 'POST';
    }

    const url = joinAbsoluteUrlPath(
      environment.las2peerWebConnectorUrl,
      this.SUCCESS_MODELING_SERVICE_PATH,
      this.SUCCESS_MODELING_MEASURE_PATH,
      groupID,
    );
    return this.makeRequest<{ xml: string }>(url, {
      method,
      body: JSON.stringify({ xml }),
    })
      .then((response) => response.xml)
      .catch((response) => {
        console.error(response);
        throw response;
      });
  }

  saveMeasureCatalogAndObserve(groupID: string, xml: string) {
    const url = joinAbsoluteUrlPath(
      environment.las2peerWebConnectorUrl,
      this.SUCCESS_MODELING_SERVICE_PATH,
      this.SUCCESS_MODELING_MEASURE_PATH,
      groupID,
    );

    return this.makeRequestAndObserve<{ xml: string }>(url, {
      method: 'PUT',
      body: JSON.stringify({ xml }),
      observe: 'response',
    });
  }

  async fetchMessageDescriptions(serviceName: string) {
    return this.fetchMessageDescriptionsAndObserve(
      serviceName,
    ).toPromise();
  }

  fetchMessageDescriptionsAndObserve(serviceName: string) {
    const url = joinAbsoluteUrlPath(
      environment.las2peerWebConnectorUrl,
      this.SUCCESS_MODELING_SERVICE_PATH,
      this.SUCCESS_MODELING_MESSAGE_DESCRIPTION_PATH,
      serviceName,
    );
    return this.makeRequestAndObserve(url);
  }

  async visualizeQuery(
    query: string,
    queryParams: string[],
    format: string = 'JSON',
  ) {
    const url = joinAbsoluteUrlPath(
      environment.las2peerWebConnectorUrl,
      this.QUERY_VISUALIZATION_SERVICE_PATH,
      this.QUERY_VISUALIZATION_VISUALIZE_QUERY_PATH +
        `?format=${format}`,
    );
    const requestBody = {
      cache: true,
      dbkey: 'las2peermon',
      height: '200px',
      width: '300px',
      modtypei: null,
      query,
      queryparams: queryParams,
      title: '',
      save: true,
    };
    const profile = JSON.parse(localStorage.getItem('profile'));
    let authorHeader;
    if (profile) {
      authorHeader = {
        Authorization:
          'Basic ' +
          btoa(
            `${profile.preferred_username as string}:${
              profile.sub as string
            }`,
          ),
      };
    }

    return this.makeRequest(url, {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        ...authorHeader,
      },
    });
  }
  fetchVisualizationData(
    query: string,
    queryParams: string[],
    format: string = 'JSON',
  ) {
    let url: string;
    if (format) {
      url = joinAbsoluteUrlPath(
        environment.las2peerWebConnectorUrl,
        this.QUERY_VISUALIZATION_SERVICE_PATH,
        this.QUERY_VISUALIZATION_VISUALIZE_QUERY_PATH,
        `?format=${format}`,
      );
    } else {
      url = joinAbsoluteUrlPath(
        environment.las2peerWebConnectorUrl,
        this.QUERY_VISUALIZATION_SERVICE_PATH,
        this.QUERY_VISUALIZATION_VISUALIZE_QUERY_PATH,
      );
    }

    const requestBody = {
      cache: true,
      dbkey: 'las2peermon',
      height: '200px',
      width: '300px',
      modtypei: null,
      query,
      queryparams: queryParams,
      title: '',
      save: true,
    };
    const profile = JSON.parse(localStorage.getItem('profile'));
    let authorHeader;
    if (profile) {
      authorHeader = {
        Authorization:
          'Basic ' +
          btoa(
            `${profile.preferred_username as string}:${
              profile.sub as string
            }`,
          ),
      };
    }

    return this.makeRequestAndObserve(url, {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        ...authorHeader,
      },
    });
  }

  async searchProjectOnReqBaz(project: string) {
    if (project.length === 0) return;
    const url = joinAbsoluteUrlPath(
      environment.reqBazUrl,
      this.REQBAZ_PROJECTS_PATH + `?search=${project}`,
    );
    const options: { headers: { [key: string]: string } } = {
      headers: {},
    };
    if (this.userCredentials) {
      options.headers.Authorization =
        'Bearer ' + this.userCredentials.token;
    }
    return this.makeRequest(url, options);
  }

  async searchCategoryOnReqBaz(projectId: number, category: string) {
    const url = joinAbsoluteUrlPath(
      environment.reqBazUrl,
      this.REQBAZ_PROJECTS_PATH,
      projectId,
      this.REQBAZ_CATEGORIES_PATH + `?search=${category}`,
    );
    const options: { headers: { [key: string]: string } } = {
      headers: {},
    };
    if (this.userCredentials) {
      options.headers.Authorization =
        'Bearer ' + this.userCredentials.token;
    }
    return this.makeRequest(url, options);
  }

  async fetchRequirementsOnReqBaz(
    categoryId: number,
  ): Promise<Requirement[]> {
    const url = joinAbsoluteUrlPath(
      environment.reqBazUrl,
      this.REQBAZ_CATEGORIES_PATH,
      categoryId,
      this.REQBAZ_REQUIREMENTS_PATH,
    );
    const options: { headers: { [key: string]: string } } = {
      headers: {},
    };
    if (this.userCredentials) {
      options.headers.Authorization =
        'Bearer ' + this.userCredentials.token;
    }
    return this.makeRequest(url, options);
  }

  fetchRequirementsOnReqBazAndObserve(categoryId: number) {
    const url = joinAbsoluteUrlPath(
      environment.reqBazUrl,
      this.REQBAZ_CATEGORIES_PATH,
      categoryId,
      this.REQBAZ_REQUIREMENTS_PATH,
    );
    const options: { headers: { [key: string]: string } } = {
      headers: {},
    };
    if (this.userCredentials) {
      options.headers.Authorization =
        'Bearer ' + this.userCredentials.token;
    }
    return this.makeRequestAndObserve(url, options);
  }

  async realizeRequirementOnReqBaz(requirementId: number) {
    const url = joinAbsoluteUrlPath(
      environment.reqBazUrl,
      this.REQBAZ_REQUIREMENTS_PATH,
      requirementId,
      this.REQBAZ_REALIZED_PATH,
    );
    const options: {
      headers: { [key: string]: string };
      method: string;
    } = {
      headers: {},
      method: 'POST',
    };
    if (this.userCredentials) {
      options.headers.Authorization =
        'Bearer ' + this.userCredentials.token;
    }
    return this.makeRequest(url, options);
  }

  async becomeLeaddeveloperOnReqBaz(requirementId: number) {
    const url = joinAbsoluteUrlPath(
      environment.reqBazUrl,
      this.REQBAZ_REQUIREMENTS_PATH,
      requirementId,
      this.REQBAZ_LEADDEV_PATH,
    );
    const options: {
      headers: { [key: string]: string };
      method: string;
    } = {
      headers: {},
      method: 'POST',
    };
    if (this.userCredentials) {
      options.headers.Authorization =
        'Bearer ' + this.userCredentials.token;
    }
    return this.makeRequest(url, options);
  }

  async stopBeingLeaddeveloperOnReqBaz(requirementId: number) {
    const url = joinAbsoluteUrlPath(
      environment.reqBazUrl,
      this.REQBAZ_REQUIREMENTS_PATH,
      requirementId,
      this.REQBAZ_LEADDEV_PATH,
    );
    const options: {
      headers: { [key: string]: string };
      method: string;
    } = {
      headers: {},
      method: 'DELETE',
    };
    if (this.userCredentials) {
      options.headers.Authorization =
        'Bearer ' + this.userCredentials.token;
    }
    return this.makeRequest(url, options);
  }

  async unrealizeRequirementOnReqBaz(requirementId: number) {
    const url = joinAbsoluteUrlPath(
      environment.reqBazUrl,
      this.REQBAZ_REQUIREMENTS_PATH,
      requirementId,
      this.REQBAZ_REALIZED_PATH,
    );
    const options: {
      headers: { [key: string]: string };
      method: string;
    } = {
      headers: {},
      method: 'DELETE',
    };
    if (this.userCredentials) {
      options.headers.Authorization =
        'Bearer ' + this.userCredentials.token;
    }
    return this.makeRequest(url, options);
  }
}

export function joinAbsoluteUrlPath(...args) {
  return args
    .map((pathPart: string | number) => {
      if (typeof pathPart === 'number') {
        pathPart = pathPart.toString();
      }
      return pathPart.toString()?.replace(/(^\/|\/$)/g, '');
    })
    .join('/');
}
