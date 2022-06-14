/* eslint-disable @typescript-eslint/dot-notation */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { Injectable } from '@angular/core';

import {
  HttpClient,
  HttpErrorResponse,
  HttpResponse,
} from '@angular/common/http';
import { firstValueFrom, forkJoin, Observable, of } from 'rxjs';
import { catchError, map, take, tap, timeout } from 'rxjs/operators';
import { merge, cloneDeep } from 'lodash-es';
import { environment } from 'src/environments/environment';
import { SuccessModel } from '../models/success.model';
import { GroupMember } from '../models/community.model';
import {
  LimeSurveyForm,
  Survey,
  SurveyForm,
} from '../models/survey.model';
import { Questionnaire } from '../models/questionnaire.model';
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
/**
 * Service for communication with the LAS2peer platform.
 */
@Injectable({
  providedIn: 'root',
})
export class Las2peerService {
  CONTACT_SERVICE_PATH = 'contactservice';
  SUCCESS_MODELING_SERVICE_PATH = 'mobsos-success-modeling/apiv2';
  QUERY_VISUALIZATION_SERVICE_PATH = 'QVS';
  SURVEYS_SURVEY_PATH = 'surveys';

  SERVICES_PATH = 'las2peer/services/services';
  CONTACT_GROUPS_PATH = 'groups';
  CONTACT_MEMBERS_PATH = 'member';
  LOOKUP_USER_PATH = 'user';
  SUCCESS_MODELING_MODELS_PATH = 'models';
  SUCCESS_MODELING_MEASURE_PATH = 'measures';
  SUCCESS_MODELING_MESSAGE_DESCRIPTION_PATH = 'messageDescriptions';
  SUCCESS_MODELING_SERVICE_DISCOVERY_PATH = 'services';
  SUCCESS_MODELING_GROUP_PATH = 'groups';
  QUERY_VISUALIZATION_VISUALIZE_QUERY_PATH = '/query/visualize';
  REQBAZ_PROJECTS_PATH = 'projects';
  REQBAZ_CATEGORIES_PATH = 'categories';
  REQBAZ_REQUIREMENTS_PATH = 'requirements';
  REQBAZ_REALIZED_PATH = 'realized';
  REQBAZ_LEADDEV_PATH = 'leaddevelopers';
  SURVEYS_SERVICE_PATH = 'mobsos-surveys';
  SURVEYS_QUESTIONNAIRES_PATH = 'questionnaires';
  SURVEYS_SURVEY_QUESTIONNAIRE_SUFFIX = 'questionnaire';
  SURVEYS_QUESTIONNAIRE_FORM_SUFFIX = 'form';
  LIME_SURVEY_SURVEYS_PATH: string | number = 'surveys';
  LIME_SURVEY_RESPONSES_PATH: string | number = 'responses';

  userCredentials: {
    token: string;
    preferred_username: string;
    sub?: string;
  };

  coreServices = [
    {
      url: joinAbsoluteUrlPath(
        environment.las2peerWebConnectorUrl,
        this.SUCCESS_MODELING_SERVICE_PATH,
        'swagger.json',
      ),
      name: 'MobSOS Success Modeling',
      available: true,
      reason: undefined,
    },
    {
      url: joinAbsoluteUrlPath(
        environment.mobsosSurveysUrl,
        'swagger.json',
      ),
      name: 'MobSOS Surveys',
      available: true,
      reason: undefined,
    },
    {
      url: joinAbsoluteUrlPath(
        environment.las2peerWebConnectorUrl,
        this.CONTACT_SERVICE_PATH,
        'swagger.json',
      ),
      name: 'Contact Service',
      available: true,
      reason: undefined,
    },
    {
      url: joinAbsoluteUrlPath(
        environment.las2peerWebConnectorUrl,
        this.QUERY_VISUALIZATION_SERVICE_PATH,
        'swagger.json',
      ),
      name: 'MobSOS Query Visualization Service',
      available: true,
      reason: undefined,
    },
    {
      url: joinAbsoluteUrlPath(
        environment.limeSurveyProxyUrl,
        this.LIME_SURVEY_SURVEYS_PATH,
      ),
      name: 'LimeSurvey Proxy',
      available: true,
      reason: undefined,
    },
  ];

  constructor(private http: HttpClient) {}

  get successModelingIsAvailable(): boolean {
    return !this.unavailableServices.find(
      (s) => s.name === 'MobSOS Success Modeling',
    );
  }

  get contactserviceIsAvailable(): boolean {
    return !this.unavailableServices.find(
      (s) => s.name === 'Contact Service',
    );
  }

  get unavailableServices() {
    return this.coreServices.filter((service) => !service.available);
  }

  get limesurveyProxyIsAvailable(): boolean {
    return !this.unavailableServices.find(
      (s) => s.name === 'LimeSurvey Proxy',
    );
  }

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

  async makeRequest(
    url: string,
    options: HttpOptions = {},
    anonymous = false,
  ): Promise<any> {
    return firstValueFrom(
      this.makeRequestAndObserve(url, options, anonymous).pipe(
        take(1),
      ),
    );
  }

  makeRequestAndObserve<T>(
    url: string,
    options: HttpOptions = {},
    anonymous: boolean = false,
  ): Observable<T | Request | any> {
    if (
      this.unavailableServices?.some((service) =>
        url.includes(service.url),
      )
    ) {
      const error = new HttpErrorResponse({
        error: `Can't make request to ${url} because the service is unavailable`,
        status: 503,
        url,
      });

      return of(error);
    }
    options = merge(
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'accept-language': 'en-US',
          oidc_provider: environment.openIdAuthorityUrl,
        },
      },
      options,
    );

    if (!anonymous) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment

      try {
        const cred = localStorage.getItem('profile');
        const token = localStorage.getItem('access_token');
        if (cred === 'undefined') {
          throw new Error(
            'credentials are undefined in localStorage',
          );
        }
        this.userCredentials = JSON.parse(cred);
        const username = this.userCredentials?.preferred_username;
        const sub = this.userCredentials?.sub;
        if (username) {
          options.headers.Authorization =
            'Basic ' + btoa(`${username}:${sub}`);
        }
        if (token) {
          options.headers.access_token = token;
        }
      } catch (error) {
        console.error(error);
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
    return this.makeRequestAndObserve(url, { observe: 'response' });
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
    if (!groupName) {
      console.error('Cannot fetch group members without group name');
      return of(null);
    }
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
    return this.makeRequestAndObserve(
      url,
      { observe: 'response' },
      true,
    );
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
      this.makeRequest(url)
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
    const requests = this.coreServices.map((service) => {
      return {
        name: service.name,
        request: this.makeRequestAndObserve(
          service.url,
          { observe: 'response' },
          true,
        ).pipe(
          timeout(15 * ONE_SECOND_IN_MS),
          catchError((err) => {
            return of(err);
          }),
        ),
      };
    });
    return forkJoin(requests.map((r) => r.request)).pipe(
      map(
        (responses) =>
          responses
            .map((response, index) => {
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
              } else {
                switch (response.status) {
                  case 200:
                    return undefined;
                  case 404:
                    return {
                      name: requests[index].name,
                      reason: 'Service not found in the network',
                    };
                  case 401:
                    return {
                      name: requests[index].name,
                      reason:
                        'You are not authorized to access this service. You might need to login again.',
                    };
                  case 500:
                    return {
                      name: requests[index].name,
                      reason: `Server error: ${
                        response.error as string
                      }`,
                    };
                  default:
                    return {
                      name: requests[index].name,
                      reason: 'An unknown error occurred',
                    };
                }
              }
            })
            .filter((service) => !!service), // retruns a list of names of the services that are not available as well as the reason for the error
      ),
      tap((services) => {
        services.forEach((unavailableService) => {
          const service = this.coreServices.find(
            (s) => s.name === unavailableService.name,
          );
          service.available = false;
          service.reason = unavailableService.reason;
        });
      }), // sets the available property of the services to false for the services that are not available
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
    return this.makeRequest(url, {
      headers: { access_token: null, Authorization: null },
    })
      .then((response) =>
        this.fetchQuestionnaireForms(
          response.questionnaires as Questionnaire[],
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
    return this.makeRequestAndObserve<Questionnaire[]>(url, {
      headers: { access_token: '', Authorization: '' },
    }).pipe(
      map(
        (response: { questionnaires: Questionnaire[] }) =>
          response.questionnaires,
      ),

      map((questionnaires) => {
        questionnaires = cloneDeep(questionnaires);
        for (const questionnaire of questionnaires) {
          questionnaire.name = decodeURIComponent(questionnaire.name);
          questionnaire.description = decodeURIComponent(
            questionnaire.description,
          );
        }

        return questionnaires.map((questionnaire) =>
          Questionnaire.fromJSONObject(questionnaire),
        );
      }),
      timeout(60000),
    );
  }
  /**
   * @deprecated Use the fetchQuestionnaireFormsAndObserve method instead. If you need a promise use firstValueFrom from rxjs
   * @param questionnaires
   * @returns
   */
  async fetchQuestionnaireForms(questionnaires: Questionnaire[]) {
    for (const questionnaire of questionnaires) {
      const formUrl = joinAbsoluteUrlPath(
        environment.mobsosSurveysUrl,
        this.SURVEYS_QUESTIONNAIRES_PATH,
        questionnaire.id,
        this.SURVEYS_QUESTIONNAIRE_FORM_SUFFIX,
      );
      questionnaire.formXML = await this.makeRequest(formUrl, {
        responseType: 'text',
      });
    }
    return questionnaires;
  }

  /**
   * Returns all questionaire forms fetched from the server as an observable
   *
   * @param questionnaires the questionnaires for which to fetch the forms
   * @returns an observable of the forms
   */
  fetchQuestionnaireFormsAndObserve(questionnaires: Questionnaire[]) {
    if (!questionnaires) {
      return of([]);
    }
    const questionaireFormRequests = questionnaires?.map(
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
            console.error(err);
            return of(undefined);
          }),
        );
      },
    );
    return forkJoin(questionaireFormRequests);
  }

  fetchQuestionnaireFormAndObserve(id: number) {
    const formUrl = joinAbsoluteUrlPath(
      environment.mobsosSurveysUrl,
      this.SURVEYS_QUESTIONNAIRES_PATH,
      id,
      this.SURVEYS_QUESTIONNAIRE_FORM_SUFFIX,
    );
    return this.makeRequestAndObserve<string>(formUrl, {
      responseType: 'text',
      observe: 'response',
    }).pipe(
      catchError((err) => {
        console.error(err);
        return of(err);
      }),
    );
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

  getSurveys() {
    const url = joinAbsoluteUrlPath(
      environment.mobsosSurveysUrl,
      this.SURVEYS_SURVEY_PATH,
    );
    return this.makeRequestAndObserve<SurveyForm[]>(url, {
      observe: 'response',
    }).pipe(
      map((response) => {
        return response.body?.surveys as SurveyForm[];
      }),
    );
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
    return this.makeRequest(url)
      .then((response: { xml: string }) => {
        return response?.xml;
      })
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
    return this.makeRequest(url, {
      method,
      body: JSON.stringify({ xml }),
    })
      .then((response: { xml: string }) => {
        return response?.xml;
      })
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
    cache = true,
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
      cache,
      dbkey: 'las2peermon',
      height: '200px',
      width: '300px',
      modtypei: null,
      query,
      queryparams: queryParams,
      title: '',
      save: false,
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
    return this.makeRequest(url, options).catch((response) => {
      console.error(response);
    });
  }

  /**
   * Authenticates the user on the requirements bazaar (response is 404 but user seems to be authenticated)
   *
   * @returns true if user is authenticated
   */
  authenticateOnReqBaz() {
    const url = joinAbsoluteUrlPath(
      environment.reqBazUrl,
      'swagger.json',
    );
    return this.makeRequestAndObserve(url, {
      observe: 'response',
      headers: {
        'access-token': localStorage.getItem('access_token'),
      },
    }).pipe(
      map((response) => {
        return response.status === 200;
      }),
      catchError(() => {
        return of(false);
      }),
    );
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
    return this.makeRequest(url, options).catch((response) => {
      console.error(response);
    });
  }

  async fetchRequirementsOnReqBaz(categoryId: number) {
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

  lookupUser(username: string) {
    const url = joinAbsoluteUrlPath(
      environment.las2peerWebConnectorUrl,
      this.CONTACT_SERVICE_PATH,
      this.LOOKUP_USER_PATH,
      username,
    );

    return this.makeRequest(url, { observe: 'response' });
  }

  addUserToGroup(groupName: string, username: string) {
    const url = joinAbsoluteUrlPath(
      environment.las2peerWebConnectorUrl,
      this.CONTACT_SERVICE_PATH,
      this.CONTACT_GROUPS_PATH,
      groupName,
      this.CONTACT_MEMBERS_PATH,
      username,
    );
    return this.makeRequestAndObserve(url, {
      observe: 'response',
      method: 'POST',
      responseType: 'text',
    });
  }

  removeUserFromGroup(groupName: string, username: string) {
    const url = joinAbsoluteUrlPath(
      environment.las2peerWebConnectorUrl,
      this.CONTACT_SERVICE_PATH,
      this.CONTACT_GROUPS_PATH,
      groupName,
      this.CONTACT_MEMBERS_PATH,
      username,
    );
    return this.makeRequestAndObserve(url, {
      observe: 'response',
      method: 'DELETE',
      responseType: 'text',
    });
  }

  fetchSurveysFromLimeSurvey() {
    if (!this.limesurveyProxyIsAvailable) {
      return of(
        new HttpErrorResponse({
          error: 'Limesurvey proxy is not available',
        }),
      );
    }
    const url = joinAbsoluteUrlPath(
      environment.limeSurveyProxyUrl,
      this.LIME_SURVEY_SURVEYS_PATH,
    );
    return this.makeRequestAndObserve(url, { observe: 'response' });
  }

  fetchResponsesForSurveyFromLimeSurvey(sid: string) {
    if (!this.limesurveyProxyIsAvailable) {
      return of(
        new HttpErrorResponse({
          error: 'Limesurvey proxy is not available',
        }),
      );
    }
    const url = joinAbsoluteUrlPath(
      environment.limeSurveyProxyUrl,
      this.LIME_SURVEY_RESPONSES_PATH,
      `?sid=${sid}`,
    );
    return this.makeRequestAndObserve(url, { observe: 'response' });
  }
}

export function joinAbsoluteUrlPath(
  ...args: (string | number)[]
): string {
  return args
    .filter((pathPart: string | number) => !!pathPart)
    .map((pathPart: string | number) => {
      if (typeof pathPart === 'number') {
        pathPart = pathPart?.toString();
      }
      return pathPart.toString()?.replace(/(^\/|\/$)/g, '');
    })
    .join('/');
}
