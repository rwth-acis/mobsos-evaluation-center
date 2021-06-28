import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { NGXLogger } from 'ngx-logger';
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
  exhaustMap,
} from 'rxjs/operators';
import { environment } from 'src/environments/environment';

import { VData } from '../models/visualization.model';
import { Las2peerService } from './las2peer.service';
import * as Action from './store.actions';
import {
  RESTRICTED_MODE,
  _SELECTED_GROUP_ID,
  SELECTED_SERVICE,
  _SELECTED_SERVICE_NAME,
  _EDIT_MODE,
  _USER,
  VISUALIZATION_DATA,
  WORKSPACE_CATALOG_XML,
  WORKSPACE_MODEL_XML,
  SUCCESS_MODEL_FROM_NETWORK,
  MEASURE_CATALOG_FROM_NETWORK,
} from './store.selectors';
import { WorkspaceService } from './workspace.service';

@Injectable()
export class StateEffects {
  constructor(
    private actions$: Actions,
    private l2p: Las2peerService,
    private ngrxStore: Store,
    private logger: NGXLogger,
    private workspaceService: WorkspaceService,
  ) {}

  fetchServices$ = createEffect(() =>
    this.actions$.pipe(
      ofType(Action.fetchServices),
      mergeMap(() =>
        forkJoin([
          this.l2p.fetchServicesFromDiscoveryAndObserve().pipe(
            catchError((err) => {
              this.logger.error(
                'Could not fetch services from service discovery:' +
                  JSON.stringify(err),
              );
              return of(undefined);
            }),
          ),
          this.l2p.fetchServicesFromMobSOSAndObserve().pipe(
            catchError((err) => {
              this.logger.error(
                'Could not fetch services from service MobSOS:' +
                  JSON.stringify(err),
              );

              return of(undefined);
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
      switchMap(() =>
        forkJoin([
          this.l2p.fetchContactServiceGroupsAndObserve().pipe(
            catchError((err) => {
              this.logger.error(
                'Could not groups services from Contact service:' +
                  JSON.stringify(err),
              );
              return of(undefined);
            }),
          ),
          this.l2p.fetchMobSOSGroupsAndObserve().pipe(
            catchError((err) => {
              this.logger.error(
                'Could not fetch groups from service MobSOS:' +
                  JSON.stringify(err),
              );
              return of(undefined);
            }),
          ),
        ]).pipe(
          tap(([groupsFromContactService, groupsFromMobSOS]) =>
            Action.transferMissingGroupsToMobSOS({
              groupsFromContactService,
              groupsFromMobSOS,
            }),
          ),
          map(([groupsFromContactService, groupsFromMobSOS]) =>
            Action.storeGroups({
              groupsFromContactService,
              groupsFromMobSOS,
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

  setGroup$ = createEffect(() =>
    this.actions$.pipe(
      ofType(Action.setGroup),
      filter(({ groupId }) => !!groupId),
      tap(({ groupId }) => {
        this.workspaceService.startSynchronizingWorkspace(groupId);
      }),
      switchMap(({ groupId }) =>
        of(Action.fetchMeasureCatalog({ groupId })),
      ),
      catchError((err) => {
        console.error(err);
        return of(Action.failure());
      }),
      share(),
    ),
  );

  setService$ = createEffect(() =>
    this.actions$.pipe(
      ofType(Action.setService),
      withLatestFrom(this.ngrxStore.select(_SELECTED_GROUP_ID)),
      filter(([{ service }, groupId]) => !!service),
      switchMap(([{ service }, groupId]) =>
        of(
          Action.fetchSuccessModel({
            groupId,
            serviceName: service.name,
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
          catchError((err) => {
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
      switchMap(([action, [measureCatalogXML, groupId]]) =>
        this.l2p
          .saveMeasureCatalogAndObserve(groupId, measureCatalogXML)
          .pipe(map(() => Action.saveCatalogSuccess())),
      ),
      catchError((err) => {
        console.error(err);
        return of(Action.failureResponse(err));
      }),
      share(),
    ),
  );

  saveModelAndCatalogResult$ = createEffect(() =>
    this.actions$.pipe(
      ofType(Action.saveCatalogSuccess),
      withLatestFrom(
        this.ngrxStore.select(WORKSPACE_MODEL_XML),
        this.ngrxStore.select(_SELECTED_GROUP_ID),
        this.ngrxStore.select(_SELECTED_SERVICE_NAME),
      ),
      switchMap(([action, successModelXML, groupId, serviceName]) =>
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

  transferMissingGroupsToMobSOS$ = createEffect(() =>
    this.actions$.pipe(
      ofType(Action.transferMissingGroupsToMobSOS),
      switchMap((action) => {
        const missingGroups = action.groupsFromContactService.filter(
          (group) =>
            !action.groupsFromMobSOS?.find(
              (g) => g.name === group.name,
            ),
        );
        return this.l2p
          .saveGroupsToMobSOS(missingGroups)
          .pipe(map(() => Action.successResponse()));
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
        combineLatest([
          this.ngrxStore.select(_SELECTED_GROUP_ID),
          this.ngrxStore.select(_SELECTED_SERVICE_NAME),
        ]),
      ),
      switchMap(([action, [groupId, serviceName]]) =>
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
            tap((res) => {
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
      mergeMap(([{ query, queryParams }, data]) => {
        const dataForQuery = data[query];
        if (shouldFetch(dataForQuery)) {
          return this.l2p
            .fetchVisualizationData(query, queryParams)
            .pipe(
              map((vdata) =>
                Action.storeVisualizationData({
                  data: vdata,
                  query,
                  error: null,
                }),
              ),
              catchError((err) =>
                of(
                  Action.storeVisualizationData({
                    data: null,
                    query,
                    error: err,
                  }),
                ),
              ),
            );
        }
        return of(Action.failureResponse(undefined));
      }),
      catchError((err) => of(Action.failureResponse(err))),
    ),
  );

  fetchSuccessModel$ = createEffect(() =>
    this.actions$.pipe(
      ofType(Action.fetchSuccessModel),
      mergeMap(({ groupId, serviceName }) =>
        this.l2p
          .fetchSuccessModelAsObservable(groupId, serviceName)
          .pipe(
            map((xml) =>
              Action.storeSuccessModel({
                xml,
              }),
            ),
            catchError((err) => {
              return of(Action.storeSuccessModel({ xml: null }));
            }),
          ),
      ),
      catchError((err) => {
        return of(Action.storeSuccessModel({ xml: null }));
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
        this.ngrxStore.select(_USER),
        this.ngrxStore.select(VISUALIZATION_DATA),
      ),
      exhaustMap(([action, model, catalog, service, user, vdata]) =>
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
}

const ONE_MINUTE_IN_MS = 60000;
const REFETCH_INTERVAL =
  (environment.visualizationRefreshInterval
    ? environment.visualizationRefreshInterval
    : 30) * ONE_MINUTE_IN_MS;
/**
 * Determines whether a new visualization data request should be made
 * @param dataForQuery the current data from the store
 * @returns true if we should make a new request
 */
function shouldFetch(dataForQuery: VData): boolean {
  if (!dataForQuery?.fetchDate) return true; // initial state: we dont have any data yet
  if (dataForQuery.data) {
    // we got data: now check if data is not too old
    if (
      Date.now() - dataForQuery.fetchDate.getTime() >
      REFETCH_INTERVAL
    ) {
      // data older than fetch interval
      return true; // data older than
    } else return false;
  } else if (dataForQuery.error) {
    const status = dataForQuery.error.status;

    // the query had led to an error
    if (
      Date.now() - dataForQuery.fetchDate.getTime() >
      5 * ONE_MINUTE_IN_MS
    ) {
      // data older than fetch interval
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
          // assume SQL query error
          return false;
        }
      } else if (status >= 500) {
        // server error
        return true;
      }
    } else {
      return false;
    }
  }
  return true;
}
