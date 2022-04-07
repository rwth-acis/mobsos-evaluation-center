import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { firstValueFrom, take } from 'rxjs';
import { AUTHENTICATED } from './store/store.selectors';

@Injectable({
  providedIn: 'root',
})
export class AuthService implements CanActivate {
  constructor(private router: Router, private store: Store) {}
  /**
   * This method checks if the user is authenticated.
   *
   * @returns  true if the user is authenticated, false otherwise.
   */
  async canActivate() {
    const auth = await firstValueFrom(
      this.store.select(AUTHENTICATED).pipe(take(1)),
    );
    if (!auth) {
      void this.router.navigate(['welcome']);
      return false;
    }
    return true;
  }
}
