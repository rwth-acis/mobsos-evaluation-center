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
import { Observable, Subscription } from 'rxjs';
import { map, withLatestFrom } from 'rxjs/operators';
import { GroupInformation } from '../models/community.model';
import { addGroup, storeGroup } from '../services/store.actions';
import { StateEffects } from '../services/store.effects';
import { USER_GROUPS } from '../services/store.selectors';

@Component({
  selector: 'app-add-community-dialog',
  templateUrl: './add-community-dialog.component.html',
  styleUrls: ['./add-community-dialog.component.scss'],
})
export class AddCommunityDialogComponent
  implements OnInit, OnDestroy
{
  form = new FormControl('', [
    Validators.required,
    this.forbiddenNameValidator(),
  ]);

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
    this.error$ = this.form.valueChanges.pipe(
      withLatestFrom(this.ngrxStore.select(USER_GROUPS)),
      map(([input, groups]) => {
        const group = groups.find((g) => g.name === input);
        let error: string;
        if (group) {
          error = 'This name is already taken';
        } else if (input?.trim().length === 0) {
          error = 'Group name cannot be empty';
        }
        return error;
      }),
    );
  }

  onSubmit() {
    const name = this.form.value?.trim();
    const group = this.groups.find((g) => g.name === name);
    if (group) {
      this.error = 'This group name is already taken';
    } else {
      this.error = null;
      this.ngrxStore.dispatch(addGroup({ groupName: name }));
      this.effects.addGroup$.subscribe((res) => {
        if ('group' in res && res.group.id) {
          this._snackBar.open('Group added', null, {
            duration: 1000,
          });
        } else if ('reason' in res) {
          this._snackBar.open(res.reason.message, 'Ok');
        }
        this.dialogRef.close();
      });
    }
  }
  forbiddenNameValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const group = this.groups?.find(
        (g) => g.name === control.value?.trim(),
      );
      return !control.value || !!group
        ? { forbiddenName: { value: control.value } }
        : null;
    };
  }
  ngOnDestroy() {
    this.subscriptions$.forEach((sub) => sub.unsubscribe());
  }
}
