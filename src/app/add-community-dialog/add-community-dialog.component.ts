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
import { BehaviorSubject, Observable, of, Subscription } from 'rxjs';
import { map, throttleTime, withLatestFrom } from 'rxjs/operators';
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
  error$: BehaviorSubject<string>;
  error: string;
  constructor(
    private dialogRef: MatDialogRef<AddCommunityDialogComponent>,
    private ngrxStore: Store,
    private effects: StateEffects,
    private _snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: string,
  ) {}

  ngOnInit(): void {
    let sub = this.ngrxStore
      .select(USER_GROUPS)
      .subscribe((groups) => {
        this.groups = groups;
      });
    this.subscriptions$.push(sub);
    sub = this.form.valueChanges
      .pipe(
        withLatestFrom(this.ngrxStore.select(USER_GROUPS)),
        throttleTime(5),
      )
      .subscribe(([input, groups]) => {
        const group = groups.find((g) => g.name === input);
        let error: string;
        if (group) {
          error = 'This name is already taken';
        } else if (input?.trim().length === 0) {
          error = 'Group name cannot be empty';
        }
        this.error$.next(error);
      });
    this.subscriptions$.push(sub);
  }

  async onSubmit() {
    const name: string = this.form.value?.trim();
    const group = this.groups.find((g) => g.name === name);
    if (!group) {
      this.error = null;
      this.ngrxStore.dispatch(addGroup({ groupName: name }));
      try {
        const res = await this.effects.addGroup$.toPromise();
        if ('group' in res && res.group.id) {
          this._snackBar.open('Group added', null, {
            duration: 1000,
          });
          this.dialogRef.close();
        } else if ('reason' in res) {
          this.groups.push({ name });
          this.error$.next('This group name is already taken');
          return;
        }
      } catch (error) {
        this.error$.next('Unknown error');
        return;
      }
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
