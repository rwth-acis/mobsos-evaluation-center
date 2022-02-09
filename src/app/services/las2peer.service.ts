/* eslint-disable @typescript-eslint/dot-notation */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { Injectable } from '@angular/core';

import { HttpClient } from '@angular/common/http';
import { firstValueFrom, forkJoin, Observable, of } from 'rxjs';
import { catchError, map, switchMap, timeout } from 'rxjs/operators';
import { merge, cloneDeep } from 'lodash-es';
import { environment } from 'src/environments/environment';
import { SuccessModel } from '../models/success.model';
import { IQuestionnaire } from '../models/questionnaire.model';
import { Requirement } from '../models/reqbaz.model';
import { GroupMember } from '../models/community.model';
interface HttpOptions {
  method?: string;
  headers?: {
    [header: string]: string | string[];
  };
  body?: string;
  responseType?: 'arraybuffer' | 'blob' | 'json' | 'text';
  observe?: 'body' | 'events' | 'response';
}
class NgHttpOptions implements HttpOptions {
  constructor(
    public headers?: {
      [header: string]: string | string[];
    },
    public body?: string,
    public responseType?: 'arraybuffer' | 'blob' | 'json' | 'text',
    public observe?: 'body' | 'events' | 'response',
  ) {}
}
const ONE_SECOND_IN_MS = 1000;

@Injectable({
  providedIn: 'root',
})
export class Las2peerService {
  SERVICES_PATH = 'las2peer/services/services';
  CONTACT_SERVICE_PATH = 'contactservice';
  CONTACT_GROUPS_PATH = 'groups';
  CONTACT_MEMBERS_PATH = 'member';
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

  coreServices = {
    'mobsos-success-modeling': {
      url: joinAbsoluteUrlPath(
        environment.las2peerWebConnectorUrl,
        this.SUCCESS_MODELING_SERVICE_PATH,
      ),
      name: 'MobSOS Success Modeling',
    },
    'mobsos-surveys': {
      url: environment.mobsosSurveysUrl,
      name: 'MobSOS Surveys',
    },
    contactservice: {
      url: joinAbsoluteUrlPath(
        environment.las2peerWebConnectorUrl,
        this.CONTACT_SERVICE_PATH,
      ),
      name: 'Contact Service',
    },
    'query-visualization-service': {
      url: joinAbsoluteUrlPath(
        environment.las2peerWebConnectorUrl,
        this.QUERY_VISUALIZATION_SERVICE_PATH,
      ),
      name: 'MobSOS Query Visualization Service',
    },
  };

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

  /**
   * @deprecated Use makeRequestAndObserve instead. If you need a promise use firstValueFrom from rxjs
   */
  async makeRequest<T>(
    url: string,
    options: HttpOptions = {},
  ): Promise<any> {
    return this.makeRequestAndObserve(url, options).toPromise();
  }

  makeRequestAndObserve<T>(
    url: string,
    options: HttpOptions = {},
    anonymous: boolean = false,
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

    if (!anonymous) {
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
      }
      if (token) {
        options.headers.access_token = token;
      }
    }

    const httpOptions: NgHttpOptions = {};

    if (options.headers) {
      httpOptions.headers = options.headers;
    }
    if (options.body) {
      httpOptions.body = options.body;
    }
    if (options.responseType) {
      httpOptions.responseType = options.responseType;
    }
    if (options.observe) {
      httpOptions.observe = options.observe;
    }

    return this.http.request(options.method, url, httpOptions);
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

  fetchGroupMembersAndObserve(
    groupName: string,
  ): Observable<GroupMember[]> {
    const url = joinAbsoluteUrlPath(
      environment.las2peerWebConnectorUrl,
      this.CONTACT_SERVICE_PATH,
      this.CONTACT_GROUPS_PATH,
      groupName,
      this.CONTACT_MEMBERS_PATH,
    );
    return this.makeRequestAndObserve<GroupMember[]>(url, {
      observe: 'response',
    }).pipe(
      map((response) => {
        if (response.status === 200 && response.body) {
          const members = response.body as object;
          return Object.keys(members).map((key) => {
            return new GroupMember(key, members[key] as string);
          });
        }
        return [];
      }),
    );
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

  checkAuthorization() {
    const url = joinAbsoluteUrlPath(
      environment.las2peerWebConnectorUrl,
      '/las2peer/auth/login',
    );
    return this.makeRequestAndObserve(url, {
      observe: 'response',
    }).pipe(
      map((response) => {
        return response.status === 200;
      }),
      catchError((error) => {
        console.error(error);
        return of(false);
      }),
    );
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
    return this.makeRequestAndObserve(url, { observe: 'response' });
  }

  /**
   * @deprecated Use the fetchMobSOSGroupAndObserve method instead. If you need a promise use firstValueFrom from rxjs
   * @param groupID
   * @returns
   */
  async fetchMobSOSGroup(groupID: string) {
    const url = joinAbsoluteUrlPath(
      environment.las2peerWebConnectorUrl,
      this.SUCCESS_MODELING_SERVICE_PATH,
      this.SUCCESS_MODELING_GROUP_PATH,
      groupID,
    );
    return this.makeRequest(url);
  }

  /**
   * @deprecated Use the fetchMobSOSGroupAndObserve method instead. If you need a promise use firstValueFrom from rxjs
   * @param groupID
   * @param service
   * @returns
   */
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

  /**
   * checks if all services are available and returns a list of all services that are not available
   *
   * @returns all unavailable services
   */
  checkServiceAvailability() {
    const requests = Object.values(this.coreServices).map(
      (service) => {
        const url = joinAbsoluteUrlPath(service.url, 'swagger.json');
        return {
          name: service.name,
          request: this.makeRequestAndObserve(
            url,
            { observe: 'response' },
            true,
          ).pipe(
            timeout(15 * ONE_SECOND_IN_MS),
            catchError((err) => {
              return of(err);
            }),
          ),
        };
      },
    );
    return forkJoin(requests.map((r) => r.request)).pipe(
      map(
        (responses) =>
          responses.map((response, index) => {
            if (!response?.status) {
              if (
                typeof response?.message === 'string' &&
                response?.message
                  ?.toLocaleLowerCase()
                  .includes('timeout')
              ) {
                return {
                  name: requests[index].name,
                  reason: 'A timeout occurred',
                };
              }
              return {
                name: requests[index].name,
                reason: 'An unknown error occurred',
              };
            } else if (response.status === 404) {
              return {
                name: requests[index].name,
                reason: 'Service not found in the network',
              };
            } else if (response.status === 401) {
              return {
                name: requests[index].name,
                reason:
                  'You are not authorized to access this service. You might need to login again.',
              };
            } else if (
              response.status >= 200 &&
              response.status < 300
            ) {
              return undefined;
            }
            return {
              name: requests[index].name,
              reason: 'An unknown error occurred',
            };
          }), // retruns a list of names of the services that are not available as well as the reason for the error
      ),
      map((services) => services.filter((r) => r !== undefined)), // removes undefined values,
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

  /**
   *
   * @deprecated Use the fetchMobSOSQuestionnairesAndObserve method instead. If you need a promise use firstValueFrom from rxjs
   */
  async fetchMobSOSQuestionnaires() {
    const url = joinAbsoluteUrlPath(
      environment.mobsosSurveysUrl,
      this.SURVEYS_QUESTIONNAIRES_PATH,
      '?full=1',
    );
    return this.makeRequest<{ questionnaires: IQuestionnaire[] }>(
      url,
      { headers: { access_token: null, Authorization: null } },
    )
      .then((response) =>
        this.fetchQuestionnaireForms(
          response.questionnaires as IQuestionnaire[],
        ),
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
    return this.makeRequestAndObserve<IQuestionnaire[]>(url, {
      headers: { access_token: '', Authorization: '' },
    }).pipe(
      map(
        (response: { questionnaires: IQuestionnaire[] }) =>
          response.questionnaires,
      ),
      switchMap((questionnaires) =>
        forkJoin([
          this.fetchQuestionnaireFormsAndObserve(questionnaires),
          of(questionnaires),
        ]),
      ),
      map(([forms, questionnaires]) => {
        questionnaires = cloneDeep(questionnaires);
        for (let index = 0; index < questionnaires?.length; index++) {
          const questionnaire = questionnaires[index];
          questionnaire.name = decodeURIComponent(questionnaire.name);
          questionnaire.description = decodeURIComponent(
            questionnaire.description,
          );
          questionnaire.formXML = forms[index];
        }

        return questionnaires;
      }),
      timeout(60000),
    );
  }
  /**
   * @deprecated Use the fetchQuestionnaireFormsAndObserve method instead. If you need a promise use firstValueFrom from rxjs
   * @param questionnaires
   * @returns
   */
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

  /**
   * Returns all questionaire forms fetched from the server as an observable
   *
   * @param questionnaires the questionnaires for which to fetch the forms
   * @returns an observable of the forms
   */
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
        }).pipe(
          catchError((err) => {
            console.log(err);
            return of(undefined);
          }),
        );
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
    // TODO: replace deprecated function
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
    // TODO replace deprecated function
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
    let method: string;
    let url: string;
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

  /**
   * @deprecated Use the saveSuccessModelAndObserve method instead. If you need a promise use firstValueFrom from rxjs
   * @param groupID
   * @param service
   * @param xml
   * @returns
   */
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
    const xmlFromResponse = await firstValueFrom(
      this.makeRequestAndObserve<{ xml: string }>(url, {
        method,
        body: JSON.stringify({ xml }),
      }).pipe(
        map((res) => (res as { xml: string })?.xml),
        catchError((err) => {
          console.error(err);
          return null;
        }),
      ),
    );
    return xmlFromResponse;
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

  /**
   * @deprecated Use the fetchMeasureCatalogAndObserve method instead. If you need a promise use firstValueFrom from rxjs
   * @param groupID
   * @returns
   */
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

  /**
   * @deprecated Use {@link #saveMeasureCatalogAndObserve} instead. If you need a promise use firstValueFrom from rxjs
   * @param groupID
   * @param xml
   * @returns
   */
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

  /**
   * @deprecated Use {@link #fetchMessageDescriptionsAndObserve} instead. If you need a promise use firstValueFrom from rxjs
   * @param serviceName
   * @returns
   */
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

  /**
   * @deprecated Use the effect from ngrxStore instead. If you need a promise use firstValueFrom from rxjs
   * @param query
   * @param queryParams
   * @param format
   * @returns
   */
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
      observe: 'response',
      headers: {
        ...authorHeader,
      },
    }).pipe(
      catchError((err) => {
        console.error(err);
        return of(err);
      }),
    );
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
    // TODO: replace deprecated funtion
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
    // TODO: replace deprecated funtion
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
    // TODO: replace deprecated funtion
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
    // TODO: replace deprecated funtion
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
    // TODO: replace deprecated funtion
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
    // TODO: replace deprecated funtion
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
    // TODO: replace deprecated funtion
    return this.makeRequest(url, options);
  }
}

export function joinAbsoluteUrlPath(
  ...args: (string | number)[]
): string {
  return args
    .map((pathPart: string | number) => {
      if (typeof pathPart === 'number') {
        pathPart = pathPart.toString();
      }
      return pathPart.toString()?.replace(/(^\/|\/$)/g, '');
    })
    .join('/');
}
