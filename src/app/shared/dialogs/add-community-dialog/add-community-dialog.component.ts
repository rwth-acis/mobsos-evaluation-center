import { HttpErrorResponse } from '@angular/common/http';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import {
  BehaviorSubject,
  combineLatest,
  Observable,
  Subscription,
} from 'rxjs';
import { catchError, map, take, timeout } from 'rxjs/operators';
import { GroupInformation } from 'src/app/models/community.model';
import {
  addGroup,
  storeGroup,
} from 'src/app/services/store/store.actions';
import { StateEffects } from 'src/app/services/store/store.effects';
import {
  USER_GROUPS,
  GROUPS,
} from 'src/app/services/store/store.selectors';

@Component({
  selector: 'app-add-community-dialog',
  templateUrl: './add-community-dialog.component.html',
  styleUrls: ['./add-community-dialog.component.scss'],
})
export class AddCommunityDialogComponent
  implements OnInit, OnDestroy
{
  form = new FormControl('', [
    // eslint-disable-next-line @typescript-eslint/unbound-method
    Validators.required,
    this.forbiddenNameValidator(),
  ]);
  errorSubject$: BehaviorSubject<{
    groupName: string;
    message: string;
  }> = new BehaviorSubject<{ groupName: string; message: string }>(
    undefined,
  );
  groups: GroupInformation[] = [];
  subscriptions$: Subscription[] = [];
  error$: Observable<string>;
  error: string;
  constructor(
    private dialogRef: MatDialogRef<AddCommunityDialogComponent>,
    private ngrxStore: Store,
    private effects: StateEffects,
    private _snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: string,
  ) {}

  ngOnInit(): void {
    const sub = this.ngrxStore
      .select(USER_GROUPS)
      .subscribe((groups) => {
        this.groups = groups;
      });
    this.subscriptions$.push(sub);
    this.error$ = combineLatest([
      this.form.valueChanges,
      this.ngrxStore.select(GROUPS),
      this.errorSubject$.asObservable(),
    ]).pipe(
      map(
        ([input, groups, error]: [
          string,
          GroupInformation[],
          { groupName: string; message: string },
        ]) => {
          if (input?.trim().length === 0) {
            return 'Group name cannot be empty';
          }

          if (error?.groupName === input?.trim()) {
            return 'This name is already taken';
          }

          const group = groups.find((g) => g.name === input);
          if (group) {
            return 'This name is already taken';
          }
          return undefined;
        },
      ),
    );
  }

  async onSubmit(): Promise<void> {
    const name = (this.form.value as string)?.trim();
    this.ngrxStore.dispatch(addGroup({ groupName: name }));

    const res = await this.effects.addGroup$
      .pipe(
        timeout(30000),
        catchError(() =>
          of({ reason: 'Service request Timeout', status: 504 }),
        ),
        take(1),
      )
      .toPromise();

    if ('group' in res && res.group.id) {
      this._snackBar.open('Group added', null, {
        duration: 5000,
      });

      this.dialogRef.close();
    } else if (
      'reason' in res &&
      (res.reason as HttpErrorResponse).status === 400
    ) {
      this.ngrxStore.dispatch(
        storeGroup({
          group: { name, id: 'unknown', member: false },
        }),
      );

      this.errorSubject$.next({
        groupName: name,
        message: 'This group name is already taken',
      });

      return;
    } else {
      console.error(res);

      return;
    }
  }
  forbiddenNameValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const group = this.groups?.find(
        (g) => g.name === (control.value as string)?.trim(),
      );
      return !control.value || !!group
        ? { forbiddenName: { value: control.value as string } }
        : null;
    };
  }
  ngOnDestroy(): void {
    this.subscriptions$.forEach((sub) => sub.unsubscribe());
  }
}
