import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { INotification } from './models/notification.model';
import {
  BANNER_NOTIFICATIONS,
  NOTIFICATIONS,
} from './services/store/store.selectors';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private lastShownBanner: INotification;

  constructor(
    private translate: TranslateService,
    private store: Store,
    private snackBar: MatSnackBar,
  ) {}
}
