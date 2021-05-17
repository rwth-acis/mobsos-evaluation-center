import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { NGXLogger } from 'ngx-logger';
import { forkJoin, of } from 'rxjs';
import {
  map,
  mergeMap,
  catchError,
  switchMap,
  withLatestFrom,
  tap,
  filter,
  share,
  shareReplay,
} from 'rxjs/operators';
import { Las2peerService } from '../las2peer.service';
import * as Action from './store.actions';
import { SELECTED_GROUP_ID, VISUALIZATION_DATA } from './store.selectors';

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
      )
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
          map(([groupsFromContactService, groupsFromMobSOS]) =>
            Action.storeGroups({
              groupsFromContactService,
              groupsFromMobSOS,
            })
          )
        )
      )
    )
  );

  setGroup$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(Action.setGroup),
        tap(({ groupId }) => Action.fetchMeasureCatalog({ groupId }))
      ),
    { dispatch: false }
  );

  setService$ = createEffect(() =>
    this.actions$.pipe(
      ofType(Action.setService),
      filter(({ service }) => service !== undefined),
      withLatestFrom(this.ngrxStore.select(SELECTED_GROUP_ID)),
      map(([{ service }, groupId]) =>
        Action.fetchSuccessModel({ groupId, serviceName: service.name })
      )
    )
  );

  fetchMeasureCatalog$ = createEffect(() =>
    this.actions$.pipe(
      ofType(Action.fetchMeasureCatalog),
      mergeMap(({ groupId }) =>
        this.l2p.fetchMeasureCatalogAsObservable(groupId).pipe(
          share(),
          map((MeasureCatalogXML) =>
            Action.storeCatalogXML({
              xml: MeasureCatalogXML,
            })
          )
        )
      )
    )
  );

  fetchVisualizationData$ = createEffect(() =>
    this.actions$.pipe(
      ofType(Action.fetchVisualizationData),
      withLatestFrom(this.ngrxStore.select(VISUALIZATION_DATA)),
      switchMap(([{ query, queryParams }, data]) => {
        const dataForQuery = data[query];
        if (
          !dataForQuery ||
          dataForQuery.fetchDate.getTime() > Date.now() - 300000
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
      })
    )
  );

  fetchSuccessModel$ = createEffect(() =>
    this.actions$.pipe(
      ofType(Action.fetchSuccessModel),
      switchMap(({ groupId, serviceName }) =>
        this.l2p.fetchSuccessModelAsObservable(groupId, serviceName).pipe(
          map((SuccessModelXML) =>
            Action.storeCatalogXML({
              xml: SuccessModelXML,
            })
          )
        )
      ),
      share()
    )
  );
}
