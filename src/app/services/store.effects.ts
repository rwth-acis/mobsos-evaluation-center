import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { props, Store } from '@ngrx/store';
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
} from 'rxjs/operators';

import { VData } from '../models/visualization.model';
import { Las2peerService } from './las2peer.service';
import * as Action from './store.actions';
import {
  MEASURE_CATALOG,
  MEASURE_CATALOG_XML,
  RESTRICTED_MODE,
  SELECTED_GROUP_ID,
  SELECTED_SERVICE,
  SELECTED_SERVICE_NAME,
  SUCCESS_MODEL,
  SUCCESS_MODEL_XML,
  USER,
  VISUALIZATION_DATA,
  WORKSPACE_CATALOG,
  WORKSPACE_CATALOG_XML,
  WORKSPACE_MODEL_XML,
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
      share(),
    ),
  );

  setService$ = createEffect(() =>
    this.actions$.pipe(
      ofType(Action.setService),
      withLatestFrom(this.ngrxStore.select(SELECTED_GROUP_ID)),
      filter(([{ service }, groupId]) => !!service),
      switchMap(([{ service }, groupId]) =>
        of(
          Action.fetchSuccessModel({
            groupId,
            serviceName: service.name,
          }),
        ),
      ),
      share(),
    ),
  );

  initState$ = createEffect(() =>
    this.actions$.pipe(
      ofType(Action.initState),
      withLatestFrom(
        this.ngrxStore.select(USER),
        this.ngrxStore.select(SELECTED_GROUP_ID),
      ),
      tap(([action, user, groupId]) => {
        if (user?.profile) {
          this.l2p.setCredentials(
            user?.profile.preferred_username,
            null,
            user.access_token,
          );
        }
      }),
      switchMap(() => of(Action.success())),
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
      }),
      switchMap(({ user }) => of(Action.success())),
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
    ),
  );

  saveModelAndCatalog$ = createEffect(() =>
    this.actions$.pipe(
      ofType(Action.saveModelAndCatalog),
      withLatestFrom(
        combineLatest([
          this.ngrxStore.select(WORKSPACE_CATALOG_XML),
          this.ngrxStore.select(SELECTED_GROUP_ID),
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
        this.ngrxStore.select(SELECTED_GROUP_ID),
        this.ngrxStore.select(SELECTED_SERVICE_NAME),
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
          this.ngrxStore.select(SELECTED_GROUP_ID),
          this.ngrxStore.select(SELECTED_SERVICE_NAME),
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
      withLatestFrom(this.ngrxStore.select(SELECTED_GROUP_ID)),
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
          if (dataForQuery?.error) {
            Action.removeVisualizationDataForQuery({ query });
          }
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
      tap((action) => {
        Action.setGroup({ groupId: action.groupId });
        Action.enableEdit();
      }),
      withLatestFrom(
        this.ngrxStore.select(SUCCESS_MODEL),
        this.ngrxStore.select(MEASURE_CATALOG),
        this.ngrxStore.select(RESTRICTED_MODE),
        this.ngrxStore.select(SELECTED_SERVICE),
        this.ngrxStore.select(USER),
      ),
      switchMap(
        ([action, model, catalog, restricted, service, user]) =>
          this.workspaceService
            .syncWithCommunnityWorkspace(action.groupId)
            .pipe(
              map((synced) => {
                if (synced) {
                  let owner = action.owner;

                  try {
                    this.workspaceService.switchWorkspace(
                      action.owner,
                      action.serviceName,
                      action.username,
                      null,
                      action.role,
                    );
                  } catch (error) {
                    if (!restricted) {
                      this.workspaceService.initWorkspace(
                        action.groupId,
                        user?.profile.preferred_username,
                        service,
                        catalog,
                        model,
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
                      user?.profile.preferred_username,
                      service,
                      catalog,
                      model,
                    );
                  }
                  if (!currentCommunityWorkspace) {
                    return Action.failure();
                  } else
                    return Action.setCommunityWorkspace({
                      workspace: currentCommunityWorkspace,
                      owner,
                      serviceName: action.serviceName,
                    });
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

/**
 * Determines whether a new visualization data request should be made
 * @param dataForQuery the current data from the store
 * @returns true if we should make a new request
 */
function shouldFetch(dataForQuery: VData): boolean {
  if (!dataForQuery) return true;
  if (dataForQuery.error) {
    const status = dataForQuery.error.status;
    if (!status) {
      // Unknown error
      return true;
    } else if (status === 400) {
      // SQL query error
      return false;
    } else if (status >= 500) {
      // Server error
      if (dataForQuery?.fetchDate.getTime() < Date.now() - 300000)
        return true;
    }
  } else if (dataForQuery.fetchDate.getTime() < Date.now() - 300000) {
    return true;
  }
  return false;
}
