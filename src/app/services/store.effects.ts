import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { NGXLogger } from 'ngx-logger';
import { EMPTY, forkJoin, of } from 'rxjs';
import { map, mergeMap, catchError, tap } from 'rxjs/operators';
import { Las2peerService } from '../las2peer.service';
import * as Action from './store.actions';

@Injectable()
export class StateEffects {
  constructor(
    private actions$: Actions,
    private l2p: Las2peerService,
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
          tap((s) => this.logger.debug(s)),
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
}
