import { MatSnackBarConfig } from '@angular/material/snack-bar';

export interface INotification {
  type: NOTIFICATION_TYPE;
  createdAt: Date;
  message: string; // should be a key to be translated
  config: MatSnackBarConfig;
  id?: string;
}

export enum NOTIFICATION_TYPE {
  SILENT = 'silent', // only added to the array of notification
  FINE = 'fine',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
}

export class AppNotification implements INotification {
  createdAt: Date;

  constructor(
    public type: NOTIFICATION_TYPE,
    public message: string,
    public config: MatSnackBarConfig,
    public id?: string,
  ) {
    this.createdAt = new Date();
  }
}
