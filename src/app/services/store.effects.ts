import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { NGXLogger } from 'ngx-logger';
import { EMPTY, forkJoin, of, combineLatest } from 'rxjs';
import {
  map,
  mergeMap,
  catchError,
  tap,
  switchMap,
  withLatestFrom,
} from 'rxjs/operators';
import { Las2peerService } from '../las2peer.service';
import * as Action from './store.actions';
import { SELECTED_GROUP_ID, SELECTED_SERVICE_NAME } from './store.selectors';

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
                'Could not fetch services from service MobSOS:' +
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

  setGroup$ = createEffect(() =>
    this.actions$.pipe(
      ofType(Action.setGroup),
      tap(({ groupId }) =>
        this.ngrxStore.dispatch(Action.fetchMeasureCatalog({ groupId }))
      )
    )
  );

  fetchMeasureCatalog$ = createEffect(() =>
    this.actions$.pipe(
      ofType(Action.fetchMeasureCatalog),
      switchMap(({ groupId }) =>
        this.l2p.fetchMeasureCatalogAsObservable(groupId).pipe(
          map((MeasureCatalogXML) =>
            Action.storeCatalogXML({
              xml: MeasureCatalogXML,
            })
          )
        )
      )
    )
  );

  fetchSuccessModel$ = createEffect(() =>
    this.actions$.pipe(
      ofType(Action.fetchSuccessModel),
      withLatestFrom(
        combineLatest([
          this.ngrxStore.select(SELECTED_GROUP_ID),
          this.ngrxStore.select(SELECTED_SERVICE_NAME),
        ])
      ),
      switchMap(([action, [groupId, serviceName]]) =>
        this.l2p.fetchSuccessModelAsObservable(groupId, serviceName).pipe(
          map((SuccessModelXML) =>
            Action.storeCatalogXML({
              xml: SuccessModelXML,
            })
          )
        )
      )
    )
  );
}
