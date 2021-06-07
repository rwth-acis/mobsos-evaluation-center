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
} from 'rxjs/operators';
import { Las2peerService } from '../las2peer.service';
import { delayedRetry } from './retryOperator';
import * as Action from './store.actions';
import { transferMissingGroupsToMobSOS } from './store.actions';
import {
  MEASURE_CATALOG_XML,
  SELECTED_GROUP_ID,
  SELECTED_SERVICE_NAME,
  SUCCESS_MODEL_XML,
  VISUALIZATION_DATA,
} from './store.selectors';

@Injectable()
export class StateEffects {
  constructor(
    private actions$: Actions,
    private l2p: Las2peerService,
    private ngrxStore: Store,
    private logger: NGXLogger
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
                  JSON.stringify(err)
              );
              return of(undefined);
            })
          ),
          this.l2p.fetchServicesFromMobSOSAndObserve().pipe(
            catchError((err) => {
              this.logger.error(
                'Could not fetch services from service MobSOS:' +
                  JSON.stringify(err)
              );

              return of(undefined);
            })
          ),
        ]).pipe(
          map(([servicesFromL2P, servicesFromMobSOS]) =>
            Action.storeServices({
              servicesFromL2P,
              servicesFromMobSOS,
            })
          )
        )
      ),
      catchError((err) => {
        console.error(err);
        return of(Action.failureResponse(err));
      }),
      share()
    )
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
                  JSON.stringify(err)
              );
              return of(undefined);
            })
          ),
          this.l2p.fetchMobSOSGroupsAndObserve().pipe(
            catchError((err) => {
              this.logger.error(
                'Could not fetch groups from service MobSOS:' +
                  JSON.stringify(err)
              );
              return of(undefined);
            })
          ),
        ]).pipe(
          filter(
            ([groupsFromContactService, groupsFromMobSOS]) =>
              !!groupsFromContactService || !!groupsFromMobSOS
          ),
          tap(([groupsFromContactService, groupsFromMobSOS]) =>
            Action.transferMissingGroupsToMobSOS({
              groupsFromContactService,
              groupsFromMobSOS,
            })
          ),
          map(([groupsFromContactService, groupsFromMobSOS]) =>
            Action.storeGroups({
              groupsFromContactService,
              groupsFromMobSOS,
            })
          )
        )
      ),
      catchError((err) => {
        console.error(err);
        return of(Action.failureResponse(err));
      }),
      share()
    )
  );

  setGroup$ = createEffect(() =>
    this.actions$.pipe(
      ofType(Action.setGroup),
      filter(({ groupId }) => !!groupId),
      switchMap(({ groupId }) => of(Action.fetchMeasureCatalog({ groupId })))
    )
  );

  setService$ = createEffect(() =>
    this.actions$.pipe(
      ofType(Action.setService),
      withLatestFrom(this.ngrxStore.select(SELECTED_GROUP_ID)),
      filter(([{ service }, groupId]) => !!service),
      switchMap(([{ service }, groupId]) =>
        of(Action.fetchSuccessModel({ groupId, serviceName: service.name }))
      )
    )
  );

  fetchMeasureCatalog$ = createEffect(() =>
    this.actions$.pipe(
      ofType(Action.fetchMeasureCatalog),
      switchMap(({ groupId }) =>
        this.l2p.fetchMeasureCatalogAsObservable(groupId).pipe(
          map((MeasureCatalogXML) =>
            Action.storeCatalog({
              xml: MeasureCatalogXML,
            })
          ),
          catchError((err) => {
            return of(Action.storeCatalog({ xml: null }));
          })
        )
      )
    )
  );

  saveModelAndCatalog$ = createEffect(() =>
    this.actions$.pipe(
      ofType(Action.saveModelAndCatalog),
      withLatestFrom(
        combineLatest([
          this.ngrxStore.select(MEASURE_CATALOG_XML),
          this.ngrxStore.select(SELECTED_GROUP_ID),
        ])
      ),
      switchMap(([action, [measureCatalogXML, groupId]]) =>
        this.l2p
          .saveMeasureCatalogAndObserve(groupId, measureCatalogXML)
          .pipe(map(() => Action.saveCatalogSuccess()))
      ),
      catchError((err) => {
        console.error(err);
        return of(Action.failureResponse(err));
      }),
      share()
    )
  );

  saveModelAndCatalogResult$ = createEffect(() =>
    this.actions$.pipe(
      ofType(Action.saveCatalogSuccess),
      withLatestFrom(
        combineLatest([
          this.ngrxStore.select(SUCCESS_MODEL_XML),
          this.ngrxStore.select(SELECTED_GROUP_ID),
          this.ngrxStore.select(SELECTED_SERVICE_NAME),
        ])
      ),
      switchMap(([action, [successModelXML, groupId, serviceName]]) =>
        this.l2p
          .saveSuccessModelAndObserve(groupId, serviceName, successModelXML)
          .pipe(map(() => Action.successResponse()))
      ),
      catchError((err) => {
        console.error(err);
        return of(Action.failureResponse(err));
      }),
      share()
    )
  );

  transferMissingGroupsToMobSOS$ = createEffect(() =>
    this.actions$.pipe(
      ofType(Action.transferMissingGroupsToMobSOS),
      switchMap((action) => {
        let missingGroups = action.groupsFromContactService.filter(
          (group) => !action.groupsFromMobSOS.find((g) => g.name === group.name)
        );
        return this.l2p
          .saveGroupsToMobSOS(missingGroups)
          .pipe(map(() => Action.successResponse()));
      }),
      catchError((err) => {
        console.error(err);
        return of(Action.failureResponse(err));
      }),
      share()
    )
  );

  saveModel$ = createEffect(() =>
    this.actions$.pipe(
      ofType(Action.saveModel),
      withLatestFrom(
        combineLatest([
          this.ngrxStore.select(SELECTED_GROUP_ID),
          this.ngrxStore.select(SELECTED_SERVICE_NAME),
        ])
      ),
      switchMap(([action, [groupId, serviceName]]) =>
        this.l2p
          .saveSuccessModelAndObserve(groupId, serviceName, action.xml)
          .pipe(
            tap(() => {
              Action.storeSuccessModel({ xml: action.xml });
            }),
            map(() => Action.successResponse())
          )
      ),
      catchError((err) => {
        console.error(err);
        return of(Action.failureResponse(err));
      }),
      share()
    )
  );

  saveCatalog$ = createEffect(() =>
    this.actions$.pipe(
      ofType(Action.saveCatalog),
      withLatestFrom(this.ngrxStore.select(SELECTED_GROUP_ID)),
      switchMap(([action, groupId]) =>
        this.l2p.saveMeasureCatalogAndObserve(groupId, action.xml).pipe(
          tap((res) => {
            Action.storeCatalog({ xml: action.xml });
          }),
          map(() => Action.successResponse())
        )
      ),
      catchError((err) => {
        console.error(err);
        return of(Action.failureResponse(err));
      }),
      share()
    )
  );

  fetchVisualizationData$ = createEffect(() =>
    this.actions$.pipe(
      ofType(Action.fetchVisualizationData),
      withLatestFrom(this.ngrxStore.select(VISUALIZATION_DATA)),
      mergeMap(([{ query, queryParams }, data]) => {
        const dataForQuery = data[query];
        if (
          !dataForQuery?.data ||
          dataForQuery.fetchDate.getTime() < Date.now() - 300000
        ) {
          // no data yet or last fetch time more than 5min ago
          return this.l2p.fetchVisualizationData(query, queryParams).pipe(
            map((data) =>
              Action.storeVisualizationData({
                data,
                query,
              })
            )
          );
        }
        return of(Action.failureResponse(undefined));
      }),
      catchError((err) => of(Action.failureResponse(err)))
    )
  );

  fetchSuccessModel$ = createEffect(() =>
    this.actions$.pipe(
      ofType(Action.fetchSuccessModel),
      mergeMap(({ groupId, serviceName }) =>
        this.l2p.fetchSuccessModelAsObservable(groupId, serviceName).pipe(
          map((SuccessModelXML) =>
            Action.storeSuccessModel({
              xml: SuccessModelXML,
            })
          ),
          catchError((err) => {
            return of(Action.storeSuccessModel({ xml: null }));
          })
        )
      ),
      catchError((err) => {
        return of(Action.storeSuccessModel({ xml: null }));
      }),
      share()
    )
  );
}
