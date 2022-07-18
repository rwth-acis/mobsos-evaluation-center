import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { LimeSurveyCredentials } from 'src/app/models/survey.model';
import {
  addLimeSurveyInstance,
  removeLimeSurveyInstance,
} from 'src/app/services/store/store.actions';
import { LIMESURVEY_INSTANCES } from 'src/app/services/store/store.selectors';
const URL_REGEXP =
  /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)/;
@Component({
  selector: 'app-limesurvey-management',
  templateUrl: './limesurvey-management.component.html',
  styleUrls: ['./limesurvey-management.component.scss'],
})
export class LimesurveyManagementComponent implements OnInit {
  currentInstances$: Observable<LimeSurveyCredentials[]> =
    this.ngrxStore.select(LIMESURVEY_INSTANCES);
  form: FormGroup;
  showCreds: boolean = false;
  constructor(private fb: FormBuilder, private ngrxStore: Store) {
    this.form = this.fb.group({
      limeSurveyUrl: ['', Validators.required],
      loginName: ['', Validators.required],
      loginPassword: ['', Validators.required],
    });
  }

  ngOnInit(): void {}

  addInstance() {
    if (!URL_REGEXP.test(this.form.get('limeSurveyUrl').value)) {
      alert('Please enter a valid URL');
      return;
    }
    const credentials = {
      ...this.form.value,
    };
    this.ngrxStore.dispatch(
      addLimeSurveyInstance({
        credentials,
      }),
    );
    this.form.reset();
  }

  deleteInstance(i: number) {
    this.ngrxStore.dispatch(
      removeLimeSurveyInstance({
        index: i,
      }),
    );
  }
}
