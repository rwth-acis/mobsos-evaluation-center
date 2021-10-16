import {
  HttpErrorResponse,
  HttpResponse,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';

import { combineLatest, forkJoin, of } from 'rxjs';
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
} from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { GroupInformation } from '../models/community.model';
import { Questionnaire } from '../models/questionnaire.model';
import { ServiceMessageDescriptions } from '../models/service.model';

import { VisualizationData } from '../models/visualization.model';
import { Las2peerService } from './las2peer.service';
import * as Action from './store.actions';
import {
  disableEdit,
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
} from './store.selectors';
import { WorkspaceService } from './workspace.service';

@Injectable()
export class StateEffects {
  // hardcoded map of current visualization calls to prevent sending a POST request multiple times
  // I will leave it here for the demo but should not be necessary. Removal should not cause any problems
  static visualizationCalls = {};

  fetchServices$ = createEffect(() =>
    this.actions$.pipe(
      ofType(Action.fetchServices),
      mergeMap(() =>
        forkJoin([
          this.l2p.fetchServicesFromDiscoveryAndObserve().pipe(
            catchError((err) => {
              console.error(
                'Could not fetch services from service discovery:' +
                  JSON.stringify(err),
              );
              return of(undefined);
            }),
          ),
          this.l2p.fetchServicesFromMobSOSAndObserve().pipe(
            catchError((err) => {
              console.error(
                'Could not fetch services from service MobSOS:' +
                  JSON.stringify(err),
              );

              return of(Action.failureResponse(err));
            }),
          ),
        ]).pipe(
          map(([servicesFromL2P, servicesFromMobSOS]) =>
            Action.storeServices({
              servicesFromL2P,
              servicesFromMobSOS,
            }),
          ),
        ),
      ),
      catchError((err) => {
        console.error(err);
        return of(Action.failureResponse(err));
      }),
      share(),
    ),
  );

  fetchGroups$ = createEffect(() =>
    this.actions$.pipe(
      ofType(Action.fetchGroups),
      mergeMap(() =>
        this.l2p.fetchContactServiceGroupsAndObserve().pipe(
          map((response) => {
            if (response instanceof HttpErrorResponse) {
              throw response;
            }
            return Action.storeGroups({
              groupsFromContactService: response ? response : [],
            });
          }),
          catchError((err) => {
            console.error(
              'Could not groups services from Contact service:' +
                JSON.stringify(err),
            );
            this.ngrxStore.dispatch(
              Action.storeGroups({
                groupsFromContactService: [],
              }),
            );
            return of(Action.failureResponse(err));
          }),
        ),
      ),
      catchError((err) => {
        console.error(err);
        this.ngrxStore.dispatch(
          Action.storeGroups({
            groupsFromContactService: [],
          }),
        );
        return of(Action.failureResponse(err));
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
      }),
      switchMap(() => of(Action.success())),
      catchError((err) => {
        console.error(err);
        return of(Action.failure());
      }),
      share(),
    ),
  );

  /** ****************************
   * This effect is called whenever the user selects a new service
   * In this case we do the following:
   * - reset the success model and fetch the new success model
   */
  setService$ = createEffect(() =>
    this.actions$.pipe(
      ofType(Action.setService),
      withLatestFrom(this.ngrxStore.select(_SELECTED_GROUP_ID)),
      tap(([{ service }, groupId]) => {
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
        return of(Action.failure());
      }),
      share(),
    ),
  );

  /** ****************************
   * This effect is called whenever the user selects a new service
   * In this case we do the following:
   * - reset the success model and fetch the new success model
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
            console.error(err);
            return of(Action.failure());
          }),
        ),
      ),
      catchError((err) => {
        console.error(err);
        return of(Action.failure());
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
        return of(Action.failure());
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
            tap(() =>
              this.ngrxStore.dispatch(
                Action.storeCatalog({ xml: measureCatalogXML }),
              ),
            ),
            map(() => Action.saveCatalogSuccess()),
            catchError((err) => {
              console.error(err);
              return of(Action.failureResponse(err));
            }),
          ),
      ),
      catchError((err) => {
        console.error(err);
        return of(Action.failureResponse(err));
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
        return of(Action.failureResponse(err));
      }),
      share(),
    ),
  );

  /**
   * @deprecated MobSOS groups might be outdated. We should not rely on them.
   * Thus there is no need to transfer groups from the contact service to mobsos
   */
  transferMissingGroupsToMobSOS$ = createEffect(() =>
    this.actions$.pipe(
      ofType(Action.transferMissingGroupsToMobSOS),
      switchMap((action) => {
        if (action.groupsFromContactService) {
          const missingGroups = Object.values(
            action.groupsFromContactService,
          )?.filter(
            (group: GroupInformation) =>
              !action.groupsFromMobSOS?.find(
                (g) => g.name === group.name,
              ),
          );
          return this.l2p
            .saveGroupsToMobSOS(missingGroups)
            .pipe(map(() => Action.successResponse()));
        }
        return of(Action.failure());
      }),
      catchError((err) => {
        console.error(err);
        return of(Action.failureResponse(err));
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
        return of(Action.failureResponse(err));
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
        return of(Action.failureResponse(err));
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

        if (
          query &&
          !Object.keys(StateEffects.visualizationCalls).includes(
            query,
          ) &&
          shouldFetch(dataForQuery)
        ) {
          StateEffects.visualizationCalls[query] =
            dataForQuery?.fetchDate;

          return this.l2p
            .fetchVisualizationData(query, queryParams)
            .pipe(
              tap((res: HttpResponse<any> | HttpErrorResponse) => {
                if (res.status < 400)
                  delete StateEffects.visualizationCalls[query];
              }),
              map((response) => {
                if (response instanceof HttpErrorResponse)
                  return Action.storeVisualizationData({
                    error: response,
                    query,
                  });
                else
                  return Action.storeVisualizationData({
                    data: response,
                    query,
                    error: null,
                  });
              }),
              catchError((err) =>
                of(
                  Action.storeVisualizationData({
                    error: err,
                    query,
                  }),
                ),
              ),
            );
        }
        return of(Action.failureResponse(undefined));
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
        of(Action.fetchVisualizationData({ query, queryParams })),
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
                xml,
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
            return of(Action.failureResponse({ reason: err }));
          }),
        ),
      ),
      catchError(() => {
        return of(Action.failure());
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

  joinCommunityWorkSpace$ = createEffect(() =>
    this.actions$.pipe(
      ofType(Action.joinWorkSpace),
      withLatestFrom(
        this.ngrxStore.select(SUCCESS_MODEL_FROM_NETWORK),
        this.ngrxStore.select(MEASURE_CATALOG_FROM_NETWORK),
        this.ngrxStore.select(SELECTED_SERVICE),
        this.ngrxStore.select(USER),
        this.ngrxStore.select(VISUALIZATION_DATA_FROM_QVS),
      ),
      switchMap(([action, model, catalog, service, user, vdata]) =>
        this.workspaceService
          .syncWithCommunnityWorkspace(action.groupId)
          .pipe(
            map((synced) => {
              if (synced) {
                let owner = action.owner;
                let username = action.username;
                if (user?.signedIn) {
                  username = user.profile.preferred_username;
                }
                try {
                  this.workspaceService.switchWorkspace(
                    action.owner,
                    action.serviceName,
                    username,
                    null,
                    model,
                    catalog,
                    action.role,
                    vdata,
                  );
                } catch (error) {
                  if (user?.signedIn) {
                    this.workspaceService.initWorkspace(
                      action.groupId,
                      username,
                      service,
                      catalog,
                      model,
                      vdata,
                    );
                    owner = user?.profile.preferred_username;
                  } else {
                    return Action.failure();
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
                  return Action.failure();
                } else {
                  return Action.setCommunityWorkspace({
                    workspace: currentCommunityWorkspace,
                    owner,
                    serviceName: action.serviceName,
                  });
                }
              } else {
                const error = new Error('Could not sync with yjs');
                console.error(error.message);
                throw error;
              }
            }),
            catchError((err) => {
              console.error(err);
              return of(Action.failure());
            }),
          ),
      ),
      catchError(() => {
        return of(Action.failure());
      }),
      share(),
    ),
  );

  constructor(
    private actions$: Actions,
    private l2p: Las2peerService,
    private ngrxStore: Store,
    private workspaceService: WorkspaceService,
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
