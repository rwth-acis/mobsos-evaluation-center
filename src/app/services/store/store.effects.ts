import {
  HttpErrorResponse,
  HttpResponse,
} from '@angular/common/http';
import { Injectable, isDevMode } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';

import { combineLatest, forkJoin, of, TimeoutError } from 'rxjs';
import {
  map,
  mergeMap,
  catchError,
  switchMap,
  withLatestFrom,
  filter,
  share,
  tap,
  delay,
  distinctUntilKeyChanged,
  timeout,
} from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { GroupMember } from '../../models/community.model';
import { Questionnaire } from '../../models/questionnaire.model';
import { ServiceMessageDescriptions } from '../../models/service.model';
import { Survey } from '../../models/survey.model';

import { VisualizationData } from '../../models/visualization.model';
import { Las2peerService } from '../las2peer.service';
import * as Action from './store.actions';
import {
  disableEdit,
  fetchGroupMembers,
  fetchMeasureCatalog,
  fetchSuccessModel,
  resetFetchDate,
} from './store.actions';
import {
  _SELECTED_GROUP_ID,
  SELECTED_SERVICE,
  _SELECTED_SERVICE_NAME,
  USER,
  VISUALIZATION_DATA,
  WORKSPACE_CATALOG_XML,
  SUCCESS_MODEL_FROM_NETWORK,
  MEASURE_CATALOG_FROM_NETWORK,
  VISUALIZATION_DATA_FROM_QVS,
  SUCCESS_MODEL_XML,
  SELECTED_GROUP,
} from './store.selectors';
import { WorkspaceService } from '../workspace.service';
import { Router } from '@angular/router';
import { UserRole } from 'src/app/models/workspace.model';
/**
 * The effects handle complex interactions between components, the backend and the ngrxStore
 */
@Injectable()
export class StateEffects {
  // hardcoded map of current visualization calls to prevent sending a POST request multiple times
  // I will leave it here for the demo but should not be necessary. Removal should not cause any problems
  static visualizationCalls = {};

  /**
   * This effect just logs errors emitted by the other effects and redirects the user back to the welcome page if unauthorized.
   */
  failureResponse$ = createEffect(() =>
    this.actions$.pipe(
      ofType(Action.failureResponse),
      withLatestFrom(this.ngrxStore.select(USER)),
      tap(([action, user]) => {
        if (action?.reason) {
          if (action.reason instanceof HttpErrorResponse) {
            const reason = action.reason;
            console.warn('HTTP Error: ', reason);
            if (
              reason.status === 401 &&
              reason.error === 'agent not found' &&
              user.signedIn
            ) {
              alert(
                'You could not be authenticated, reason: ' +
                  reason.error +
                  '. Please contact the administrator',
              );
              this.ngrxStore.dispatch(
                Action.storeUser({ user: null }),
              );
              void this.router.navigate(['/welcome']);
            }
          } else {
            console.warn('A Failure occured: ', action.reason);
          }
        }
      }),
      mergeMap(() => of(Action.noop())),
      share(),
    ),
  );

  /**
   * This effect is used to fetch the services from the las2peer network. The services are store in the store.
   */
  fetchServices$ = createEffect(() =>
    this.actions$.pipe(
      ofType(Action.fetchServices),
      mergeMap(() =>
        forkJoin([
          this.l2p.fetchServicesFromDiscoveryAndObserve().pipe(
            timeout(50000),
            catchError((err) => {
              console.warn(
                'Could not fetch services from service discovery:',
                err,
              );
              return of(Action.failureResponse({ reason: err }));
            }),
          ),
          this.l2p.fetchServicesFromMobSOSAndObserve().pipe(
            timeout(50000),
            catchError((err) => {
              console.warn(
                'Could not fetch services from service MobSOS:',
                err,
              );

              return of(Action.failureResponse({ reason: err }));
            }),
          ),
        ]).pipe(
          map(([responseFromL2P, responseFromMobSOS]) => {
            const servicesFromL2P = responseFromL2P?.body;
            const servicesFromMobSOS = responseFromMobSOS?.body;
            return Action.storeServices({
              servicesFromL2P,
              servicesFromMobSOS,
            });
          }),
        ),
      ),
      catchError((err) => {
        return of(Action.failureResponse({ reason: err }));
      }),
      share(),
    ),
  );

  /**
   * This effect is used to fetch the groups from the las2peer network and then store them in the store.
   */
  fetchGroups$ = createEffect(() =>
    this.actions$.pipe(
      ofType(Action.fetchGroups),
      mergeMap(() =>
        this.l2p.fetchContactServiceGroupsAndObserve().pipe(
          timeout(30000),
          map((response) => {
            if (!response) {
              return Action.storeGroups({
                groupsFromContactService: null,
              });
            }
            if (response instanceof HttpResponse) {
              return Action.storeGroups({
                groupsFromContactService: response.body,
              });
            }
            if (response instanceof HttpErrorResponse) {
              return Action.failureResponse({
                reason: response.error,
              });
            }

            return Action.storeGroups({
              groupsFromContactService: null,
            });
          }),
          catchError((err) => {
            this.ngrxStore.dispatch(
              Action.storeGroups({ groupsFromContactService: null }),
            );
            return of(Action.failureResponse({ reason: err }));
          }),
        ),
      ),
      catchError(() => of(Action.failure({}))),
      share(),
    ),
  );

  /** ****************************
   * This effect is called whenever the user selects a new service
   * In this case we do the following:
   * - fetch the message descriptions for the new service
   */
  fetchMessageDescriptions$ = createEffect(() =>
    this.actions$.pipe(
      ofType(Action.fetchMessageDescriptions),
      filter(({ serviceName }) => !!serviceName),
      distinctUntilKeyChanged('serviceName'),
      switchMap(({ serviceName }) =>
        this.l2p.fetchMessageDescriptionsAndObserve(serviceName).pipe(
          map((descriptions: ServiceMessageDescriptions) =>
            Action.storeMessageDescriptions({
              descriptions,
              serviceName,
            }),
          ),
          catchError((err) => {
            return of(Action.failureResponse({ reason: err }));
          }),
        ),
      ),
      catchError((err) => {
        return of(Action.failureResponse({ reason: err }));
      }),
      share(),
    ),
  );

  /** *****************************
   * This effect is called whenever the user selects a new group
   * In this case we do the following:
   * - join the yjs room for that group
   * - fetch the measure catalog for that group
   * - reset the success model and fetch the new one
   * - disable the edit mode
   */
  setGroup$ = createEffect(() =>
    this.actions$.pipe(
      ofType(Action.setGroup),
      filter(({ groupId }) => !!groupId),
      tap(({ groupId }) => {
        this.workspaceService.syncWithCommunnityWorkspace(groupId);
        this.ngrxStore.dispatch(fetchMeasureCatalog({ groupId }));
        this.ngrxStore.dispatch(
          Action.storeSuccessModel({ xml: undefined }),
        );
        this.ngrxStore.dispatch(fetchSuccessModel({ groupId }));
        this.ngrxStore.dispatch(disableEdit());
        this.ngrxStore.dispatch(fetchGroupMembers({ groupId }));
      }),
      switchMap(() => of(Action.success())),
      catchError(() => {
        return of(Action.noop());
      }),
      share(),
    ),
  );

  /** *****************************
   * This effect fetches the group members and stores them in the store.
   */
  fetchGroupMembers$ = createEffect(() =>
    this.actions$.pipe(
      ofType(Action.fetchGroupMembers),
      withLatestFrom(this.ngrxStore.select(SELECTED_GROUP)),
      filter(([, group]) => !!group),
      switchMap(([{ groupId }, group]) =>
        this.l2p.fetchGroupMembersAndObserve(group?.name).pipe(
          map((groupMembers: GroupMember[]) =>
            Action.storeGroupMembers({
              groupMembers,
              groupId: groupId ? groupId : group.id,
            }),
          ),
          catchError((err) => {
            return of(Action.failureResponse({ reason: err }));
          }),
        ),
      ),

      catchError((err) => {
        return of(Action.failureResponse({ reason: err }));
      }),
      share(),
    ),
  );

  /** ****************************
   * This effect is called whenever the user selects a new service
   * In this case we do the following:
   * - disbable the edit mode
   * - reset the success model and fetch the new success model
   * - fetch the service message descriptions
   */
  setService$ = createEffect(() =>
    this.actions$.pipe(
      ofType(Action.setService),
      withLatestFrom(this.ngrxStore.select(_SELECTED_GROUP_ID)),
      tap(([{ service }, groupId]) => {
        this.ngrxStore.dispatch(disableEdit());
        this.ngrxStore.dispatch(Action.resetSuccessModel());
        this.ngrxStore.dispatch(
          fetchSuccessModel({ groupId, serviceName: service.name }),
        );
        this.ngrxStore.dispatch(
          Action.fetchMessageDescriptions({
            serviceName: service?.name,
          }),
        );
      }),
      switchMap(() => of(Action.success())),
      catchError((err) => {
        console.error(err);
        return of(Action.noop());
      }),
      share(),
    ),
  );

  storeUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(Action.storeUser),
      filter(({ user }) => !!user),
      tap(({ user }) => {
        localStorage.setItem('id_token', user.id_token);
        localStorage.setItem('access_token', user.access_token);
        localStorage.setItem('profile', JSON.stringify(user.profile));
        this.l2p.setCredentials(
          user?.profile.preferred_username,
          user.profile.sub,
          user.access_token,
        );
      }),
      switchMap(() => of(Action.success())),
    ),
  );

  fetchMeasureCatalog$ = createEffect(() =>
    this.actions$.pipe(
      ofType(Action.fetchMeasureCatalog),
      switchMap(({ groupId }) =>
        this.l2p.fetchMeasureCatalogAsObservable(groupId).pipe(
          map((xml) =>
            Action.storeCatalog({
              xml,
            }),
          ),
          catchError(() => {
            return of(Action.storeCatalog({ xml: null }));
          }),
        ),
      ),
      catchError((err) => {
        console.error(err);
        return of(Action.failureResponse({ reason: err }));
      }),
    ),
  );

  saveModelAndCatalog$ = createEffect(() =>
    this.actions$.pipe(
      ofType(Action.saveModelAndCatalog),
      withLatestFrom(
        combineLatest([
          this.ngrxStore.select(WORKSPACE_CATALOG_XML),
          this.ngrxStore.select(_SELECTED_GROUP_ID),
        ]),
      ),
      switchMap(([, [measureCatalogXML, groupId]]) =>
        this.l2p
          .saveMeasureCatalogAndObserve(groupId, measureCatalogXML)
          .pipe(
            tap((res) => {
              if (res instanceof HttpErrorResponse) return;
              this.ngrxStore.dispatch(
                Action.storeCatalog({ xml: measureCatalogXML }),
              );
            }),
            map(() => Action.saveCatalogSuccess()),
            catchError((err) => {
              console.error(err);
              return of(Action.failureResponse({ reason: err }));
            }),
          ),
      ),
      catchError((err) => {
        console.error(err);
        return of(Action.failure({ reason: err }));
      }),
      share(),
    ),
  );

  saveSuccessModel$ = createEffect(() =>
    this.actions$.pipe(
      ofType(Action.saveCatalogSuccess, Action.updateSuccessModel),
      withLatestFrom(
        this.ngrxStore.select(SUCCESS_MODEL_XML),
        this.ngrxStore.select(_SELECTED_GROUP_ID),
        this.ngrxStore.select(_SELECTED_SERVICE_NAME),
      ),
      switchMap(([, successModelXML, groupId, serviceName]) =>
        this.l2p
          .saveSuccessModelAndObserve(
            groupId,
            serviceName,
            successModelXML,
          )
          .pipe(
            map(() =>
              Action.storeSuccessModel({ xml: successModelXML }),
            ),
          ),
      ),
      catchError((err) => {
        console.error(err);
        return of(Action.failureResponse({ reason: err }));
      }),
      share(),
    ),
  );

  saveModel$ = createEffect(() =>
    this.actions$.pipe(
      ofType(Action.saveModel),
      withLatestFrom(
        this.ngrxStore.select(_SELECTED_GROUP_ID),
        this.ngrxStore.select(_SELECTED_SERVICE_NAME),
      ),
      switchMap(([action, groupId, serviceName]) =>
        this.l2p
          .saveSuccessModelAndObserve(
            groupId,
            serviceName,
            action.xml,
          )
          .pipe(
            tap(() => {
              Action.storeSuccessModel({ xml: action.xml });
            }),
            map(() => Action.successResponse()),
          ),
      ),
      catchError((err) => {
        console.error(err);
        return of(Action.failureResponse({ reason: err }));
      }),
      share(),
    ),
  );

  saveCatalog$ = createEffect(() =>
    this.actions$.pipe(
      ofType(Action.saveCatalog),
      withLatestFrom(this.ngrxStore.select(_SELECTED_GROUP_ID)),
      switchMap(([action, groupId]) =>
        this.l2p
          .saveMeasureCatalogAndObserve(groupId, action.xml)
          .pipe(
            tap(() => {
              Action.storeCatalog({ xml: action.xml });
            }),
            map(() => Action.successResponse()),
          ),
      ),
      catchError((err) => {
        console.error(err);
        return of(Action.failureResponse({ reason: err }));
      }),
      share(),
    ),
  );

  fetchQuestionnaireForm$ = createEffect(() =>
    this.actions$.pipe(
      ofType(Action.fetchQuestionnaireForm),
      switchMap((action) =>
        this.l2p
          .fetchQuestionnaireFormAndObserve(action.questionnaireId)
          .pipe(
            map((response) => {
              if (response?.body) {
                return Action.storeQuestionnaireForm({
                  formXML: response.body,
                  questionnaireId: action.questionnaireId,
                });
              }
              throw response;
            }),
          ),
      ),
      catchError((err) => {
        console.error(err);
        return of(Action.failureResponse({ reason: err }));
      }),
      share(),
    ),
  );

  fetchVisualizationData$ = createEffect(() =>
    this.actions$.pipe(
      ofType(Action.fetchVisualizationData),
      withLatestFrom(this.ngrxStore.select(VISUALIZATION_DATA)),
      mergeMap(([props, data]) => {
        const query = props.query;
        const queryParams = props.queryParams;
        const dataForQuery = data[query];
        if (!query) {
          return of(Action.failure({ reason: 'No query provided' }));
        }
        if (
          Object.keys(StateEffects.visualizationCalls).includes(query)
        ) {
          return of(
            Action.failure({
              reason: 'Call already issued, waiting for response',
            }),
          );
        }
        if (!shouldFetch(dataForQuery)) {
          return of(Action.failure({ reason: "Shouldn't fetch" }));
        }

        StateEffects.visualizationCalls[query] =
          dataForQuery?.fetchDate;

        return this.l2p
          .fetchVisualizationData(
            query,
            queryParams,
            'JSON',
            props.cache,
          )
          .pipe(
            timeout(30000),
            tap(
              (
                res: HttpResponse<any> | HttpErrorResponse | string,
              ) => {
                if (
                  res instanceof HttpResponse ||
                  res instanceof HttpErrorResponse
                ) {
                  delete StateEffects.visualizationCalls[query];
                }
                if (res instanceof HttpErrorResponse) {
                  this.ngrxStore.dispatch(
                    Action.failureResponse({ reason: res }),
                  );
                }
              },
            ),
            map((response) => {
              delete StateEffects.visualizationCalls[query];
              return handleResponse(response, query);
            }),
            catchError((error) => {
              delete StateEffects.visualizationCalls[query];
              return of(handleResponse(error, query));
            }),
          );
      }),
      catchError((err) =>
        of(
          Action.storeVisualizationData({
            error: err,
          }),
        ),
      ),
    ),
  );

  refreshVisualization$ = createEffect(() =>
    this.actions$.pipe(
      ofType(Action.refreshVisualization),
      tap(({ query }) => {
        // we need to reset the fetch date to allow refetching before the next refresh cycle (also sets visualization state to loading)
        this.ngrxStore.dispatch(resetFetchDate({ query }));
      }),
      delay(100),
      mergeMap(({ query, queryParams }) =>
        of(
          Action.fetchVisualizationData({
            query,
            queryParams,
            cache: false,
          }),
        ),
      ),
      catchError((err) => {
        return of(Action.failureResponse({ reason: err }));
      }),
      share(),
    ),
  );

  fetchSuccessModel$ = createEffect(() =>
    this.actions$.pipe(
      ofType(Action.fetchSuccessModel),
      withLatestFrom(this.ngrxStore.select(SELECTED_SERVICE)),
      mergeMap(([{ groupId, serviceName }, service]) =>
        this.l2p
          .fetchSuccessModelAsObservable(
            groupId,
            serviceName ? serviceName : service?.name,
          )
          .pipe(
            map((xml) =>
              Action.storeSuccessModel({
                xml: xml || null,
              }),
            ),
            catchError(() => {
              return of(Action.storeSuccessModel({ xml: null }));
            }),
          ),
      ),
      catchError(() => {
        return of(Action.storeSuccessModel({ xml: null }));
      }),
      share(),
    ),
  );

  fetchQuestionnaires$ = createEffect(() =>
    this.actions$.pipe(
      ofType(Action.fetchQuestionnaires),
      mergeMap(() =>
        this.l2p.fetchMobSOSQuestionnairesAndObserve().pipe(
          map((questionnaires: Questionnaire[]) =>
            Action.storeQuestionnaires({
              questionnaires,
            }),
          ),
          catchError((err: Error) => {
            return of(Action.failure({ reason: err }));
          }),
        ),
      ),
      catchError((err) => {
        return of(Action.failureResponse({ reason: err }));
      }),
      share(),
    ),
  );

  fetchSurveys$ = createEffect(() =>
    this.actions$.pipe(
      ofType(Action.fetchSurveys),
      mergeMap(() =>
        this.l2p.getSurveys().pipe(
          map((surveys: Survey[]) =>
            Action.storeSurveys({
              surveys,
            }),
          ),
          catchError((err: Error) => {
            return of(Action.failure({ reason: err }));
          }),
        ),
      ),
      catchError((err) => {
        return of(Action.failureResponse({ reason: err }));
      }),
      share(),
    ),
  );

  addGroup$ = createEffect(() =>
    this.actions$.pipe(
      ofType(Action.addGroup),
      mergeMap(({ groupName }) =>
        this.l2p.addGroup(groupName).pipe(
          map((id: string) =>
            id
              ? Action.storeGroup({
                  group: {
                    id,
                    name: groupName,
                    member: true,
                  },
                })
              : Action.failureResponse(null),
          ),
          catchError((err: HttpErrorResponse) => {
            return of(Action.failureResponse({ reason: err }));
          }),
        ),
      ),
      catchError((err: HttpErrorResponse) => {
        return of(Action.failureResponse({ reason: err }));
      }),
      share(),
    ),
  );

  storeGroup$ = createEffect(() =>
    this.actions$.pipe(
      ofType(Action.storeGroup),
      tap(({ group }) =>
        this.ngrxStore.dispatch(
          Action.setGroup({ groupId: group.id }),
        ),
      ),
      mergeMap(() => of(Action.success())),
      catchError((err: HttpErrorResponse) => {
        return of(Action.failureResponse({ reason: err }));
      }),
      share(),
    ),
  );

  addUserToGroup$ = createEffect(() =>
    this.actions$.pipe(
      ofType(Action.addUserToGroup),
      withLatestFrom(this.ngrxStore.select(SELECTED_GROUP)),
      switchMap(([{ username }, group]) =>
        this.l2p.addUserToGroup(group.name, username).pipe(
          map((res) => {
            if (res.status === 200) {
              const updatedGroup = {
                ...group,
                members: [
                  ...group.members,
                  new GroupMember(undefined, username),
                ],
              };
              return Action.updateGroup({
                group: updatedGroup,
              });
            }

            return Action.failureResponse(null);
          }),
          catchError((err: HttpErrorResponse) => {
            return of(Action.failureResponse({ reason: err }));
          }),
        ),
      ),
      catchError((err: HttpErrorResponse) => {
        return of(Action.failureResponse({ reason: err }));
      }),
      share(),
    ),
  );

  removeMemberFromGroup$ = createEffect(() =>
    this.actions$.pipe(
      ofType(Action.removeMemberFromGroup),
      withLatestFrom(this.ngrxStore.select(SELECTED_GROUP)),
      switchMap(([{ username }, group]) =>
        this.l2p.removeUserFromGroup(group.name, username).pipe(
          map((res) => {
            if (res.status === 200) {
              const updatedGroup = {
                ...group,
                members: group.members.filter(
                  (member) => member.name !== username,
                ),
              };
              return Action.updateGroup({
                group: updatedGroup,
              });
            }

            return Action.failureResponse(null);
          }),
          catchError((err: HttpErrorResponse) => {
            return of(Action.failureResponse({ reason: err }));
          }),
        ),
      ),
      catchError((err: HttpErrorResponse) => {
        return of(Action.failureResponse({ reason: err }));
      }),
      share(),
    ),
  );

  addRequirementsBazarProject$ = createEffect(() =>
    this.actions$.pipe(
      ofType(Action.addReqBazarProject),
      delay(1000),
      map(() => Action.updateSuccessModel()),
      catchError((err: HttpErrorResponse) => {
        return of(Action.failureResponse({ reason: err }));
      }),
      share(),
    ),
  );

  removeRequirementsBazarProject$ = createEffect(() =>
    this.actions$.pipe(
      ofType(Action.removeReqBazarProject),
      delay(1000),
      map(() => Action.updateSuccessModel()),
      catchError((err: HttpErrorResponse) => {
        return of(Action.failureResponse({ reason: err }));
      }),
      share(),
    ),
  );

  addModelToWorkSpace$ = createEffect(() =>
    this.actions$.pipe(
      tap(() => Action.joinWorkSpace({})),
      ofType(Action.addModelToWorkSpace),
      withLatestFrom(this.ngrxStore.select(_SELECTED_GROUP_ID)),
      switchMap(([{ xml }, id]) => {
        return this.workspaceService
          .syncWithCommunnityWorkspace(id)
          .pipe(
            map((done) => {
              if (done) {
                return Action.storeModelInWorkspace({ xml });
              } else {
                return Action.failureResponse({
                  reason: new HttpErrorResponse({
                    error: 'Cannot Sync with YJS',
                  }),
                });
              }
            }),
          );
      }),
    ),
  );

  addCatalogToWorkSpace$ = createEffect(() =>
    this.actions$.pipe(
      tap(() => Action.joinWorkSpace({})),
      ofType(Action.addCatalogToWorkspace),
      withLatestFrom(this.ngrxStore.select(_SELECTED_GROUP_ID)),
      switchMap(([{ xml }, id]) => {
        return this.workspaceService
          .syncWithCommunnityWorkspace(id)
          .pipe(
            map((done) => {
              if (done) {
                return Action.storeCatalogInWorkspace({ xml });
              } else {
                return Action.failureResponse({
                  reason: new HttpErrorResponse({
                    error: 'Cannot Sync with YJS',
                  }),
                });
              }
            }),
          );
      }),
    ),
  );

  joinCommunityWorkSpace$ = createEffect(() =>
    this.actions$.pipe(
      ofType(Action.joinWorkSpace),
      withLatestFrom(
        this.ngrxStore.select(SUCCESS_MODEL_FROM_NETWORK),
        this.ngrxStore.select(MEASURE_CATALOG_FROM_NETWORK),
        this.ngrxStore.select(SELECTED_SERVICE),
        this.ngrxStore.select(USER),
        this.ngrxStore.select(VISUALIZATION_DATA_FROM_QVS),
        this.ngrxStore.select(SELECTED_GROUP),
      ),
      switchMap(
        ([action, model, catalog, service, user, vdata, group]) => {
          return this.workspaceService
            .syncWithCommunnityWorkspace(
              action.groupId ? action.groupId : group.id,
            )
            .pipe(
              map((synced) => {
                let role: UserRole = action.role;
                if (synced) {
                  let username: string;
                  let workspaceOwner = action.owner;
                  if (user?.signedIn) {
                    username = user.profile.preferred_username;

                    if (!workspaceOwner) {
                      workspaceOwner = username; // if no workspace owner is specified, the user is the workspace owner
                    }
                    if (!role) {
                      if (workspaceOwner === username) {
                        role = UserRole.EDITOR;
                      } else {
                        role = UserRole.SPECTATOR;
                      }
                    }
                  } else {
                    username = action.username;
                    workspaceOwner = action.owner;
                    if (!role) {
                      role = UserRole.LURKER;
                    }
                  }
                  try {
                    // try joining the workspace
                    this.workspaceService.joinWorkspace(
                      workspaceOwner,
                      action.serviceName,
                      username,
                      null,
                      action.copyModel ? model : null,
                      catalog,
                      role,
                      vdata,
                    );
                  } catch (error) {
                    // exception occurs when the workspace cannot be joined
                    if (user?.signedIn) {
                      // If we are signed in we create a new workspace
                      this.workspaceService.initWorkspace(
                        action.groupId,
                        username,
                        service,
                        catalog,
                        action.copyModel ? model : null,
                        vdata,
                      );
                    } else {
                      // probably some property is undefined
                      console.error(error);
                      return Action.failure({ reason: error });
                    }
                  }
                  const currentCommunityWorkspace =
                    this.workspaceService.currentCommunityWorkspace;
                  if (
                    user?.signedIn &&
                    !currentCommunityWorkspace[
                      user.profile.preferred_username
                    ]
                  ) {
                    this.workspaceService.initWorkspace(
                      action.groupId,
                      user.profile.preferred_username,
                      service,
                      catalog,
                      model,
                      vdata,
                    );
                  }
                  if (!currentCommunityWorkspace) {
                    return Action.failure({
                      reason: 'No workspace found',
                    });
                  } else {
                    return Action.setCommunityWorkspace({
                      workspace: currentCommunityWorkspace,
                    });
                  }
                } else {
                  const error = new Error('Could not sync with yjs');
                  console.error(error.message);
                  return Action.failureResponse({
                    reason: new HttpErrorResponse({ error }),
                  });
                }
              }),
              catchError((err) => {
                console.error(err);
                return of(Action.failure({ reason: err }));
              }),
            );
        },
      ),
      catchError((err) => {
        return of(Action.failure({ reason: err }));
      }),
      share(),
    ),
  );

  constructor(
    private actions$: Actions,
    private l2p: Las2peerService,
    private ngrxStore: Store,
    private workspaceService: WorkspaceService,
    private router: Router,
  ) {}
}

const ONE_MINUTE_IN_MS = 60000;
const REFETCH_INTERVAL =
  (environment.visualizationRefreshInterval
    ? environment.visualizationRefreshInterval
    : 30) * ONE_MINUTE_IN_MS;
/**
 *
 * Determines whether a new visualization data request should be made
 *
 * @param dataForQuery the current data from the store
 * @returns true if we should make a new request
 *
 */
function shouldFetch(dataForQuery: VisualizationData): boolean {
  if (!dataForQuery?.data && !dataForQuery?.error) return true; // initial state: we dont have any data or error yet
  if (dataForQuery?.data && dataForQuery?.fetchDate) {
    // data was fetched beforehand: now check if data is not too old
    if (
      Date.now() - Date.parse(dataForQuery.fetchDate) >
      REFETCH_INTERVAL
    ) {
      // data older than fetch interval
      return true; // data older than
    } else {
      // data is recent enough no new call should be made
      return false;
    }
  } else if (dataForQuery?.error) {
    const status = dataForQuery.error?.status;

    // the query had led to an error
    // in this case we want to  refetch from the server in a shorter interval of 5 minutes
    if (
      !dataForQuery.fetchDate ||
      Date.now() - Date.parse(dataForQuery.fetchDate) >
        5 * ONE_MINUTE_IN_MS
    ) {
      if (!status) {
        // Unknown error
        return true;
      }
      if (status === 400) {
        // user error
        if (dataForQuery.error.error.includes('known/configured')) {
          // data base not configured on query visualization service
          return true;
        } else {
          // assume SQL query error so no refetch as long as user has not updated the query
          return false;
        }
      } else if (status >= 500) {
        // server error
        return true;
      }
    } else {
      // dont refetch if interval is less than 5minutes
      return false;
    }
  }
  return true; // should not be reached
}

/**
 * Handles a new visualization data response
 *
 * @param response repsonse form the visualization data service
 * @param query the query for which we want to retrieve the data
 * @returns the action that the store should dispatch. In case of success the data is stored. In case of an error the error is stored
 */
function handleResponse(response: any, query: string) {
  if (!response) {
    return Action.storeVisualizationData({
      error: 'response was empty',
      query,
    });
  }
  if (
    response === 'Timeout' ||
    response instanceof TimeoutError ||
    response.message?.includes('Timeout')
  ) {
    return Action.storeVisualizationData({
      error:
        'Timeout occured while fetching data. The query might be too complex, or the server is overloaded.',
      query,
    });
  }

  if (response instanceof HttpErrorResponse) {
    if (response.status === 0) {
      return Action.storeVisualizationData({
        error: 'An unknown error occured while fetching data.',
        query,
      });
    }
    if (response.status === 201) {
      console.error(
        'Response is 201 but should be 404 since an error occured',
      ); // should not occur
      return Action.storeVisualizationData({
        query,
        error: response.error,
      });
    }
    return Action.storeVisualizationData({
      query,
      error: response.error,
    });
  } else if (response instanceof HttpResponse) {
    if (!response.body) {
      return Action.storeVisualizationData({
        query,
        error:
          'Got response, but it contains no data. There might not be any data available',
      });
    }
    return Action.storeVisualizationData({
      data: response.body,
      query,
      error: null,
    });
  }
  return Action.failure({
    reason: new Error(
      'Unknown errror for fetching Visualization data',
    ),
  }); // should not be reached
}
