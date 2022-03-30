import { Component, Input, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Store } from '@ngrx/store';

import {
  catchError,
  filter,
  map,
  take,
  timeout,
  withLatestFrom,
} from 'rxjs/operators';
import { iconMap, translationMap } from '../config';

import { combineLatest, lastValueFrom, of, Subscription } from 'rxjs';
import {
  animate,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Questionnaire } from 'src/app/models/questionnaire.model';
import { ServiceInformation } from 'src/app/models/service.model';
import { SuccessModel } from 'src/app/models/success.model';
import {
  disableEdit,
  setService,
  saveModelAndCatalog,
  failureResponse,
  HttpActions,
} from 'src/app/services/store/store.actions';
import { StateEffects } from 'src/app/services/store/store.effects';
import {
  EDIT_MODE,
  SUCCESS_MODEL,
  SUCCESS_MODEL_IS_EMPTY,
  MEASURE_CATALOG,
  SELECTED_SERVICE,
  SELECTED_GROUP,
  MODEL_AND_CATALOG_LOADED,
  USER,
  USER_IS_OWNER_IN_CURRENT_WORKSPACE,
  ROLE_IN_CURRENT_WORKSPACE,
  IS_MEMBER_OF_SELECTED_GROUP,
  SUCCESS_MODEL_XML,
} from 'src/app/services/store/store.selectors';

@Component({
  selector: 'app-success-model',
  templateUrl: './success-model.component.html',
  styleUrls: ['./success-model.component.scss'],
  animations: [
    trigger('slideInOut', [
      transition(':enter', [
        style({ transform: 'translateY(200%)' }),
        animate(
          '500ms ease-in',
          style({ transform: 'translateY(0%)' }),
        ),
      ]),
      transition(':leave', [
        animate(
          '200ms ease-in',
          style({ transform: 'translateY(100%)' }),
        ),
      ]),
    ]),
  ],
})
export class SuccessModelComponent implements OnInit {
  @Input() restricted = false;

  editMode$ = this.ngrxStore.select(EDIT_MODE);
  successModel$ = this.ngrxStore.select(SUCCESS_MODEL);
  successModelEmpty$ = this.ngrxStore.select(SUCCESS_MODEL_IS_EMPTY);
  showSuccessModellingView$ = combineLatest([
    this.successModelEmpty$,
    this.editMode$,
  ]).pipe(map(([empty, editMode]) => editMode && !empty));

  measureCatalog$ = this.ngrxStore.select(MEASURE_CATALOG);
  selectedService$ = this.ngrxStore.select(SELECTED_SERVICE);
  selectedGroup$ = this.ngrxStore.select(SELECTED_GROUP);

  assetsLoaded$ = this.ngrxStore.select(MODEL_AND_CATALOG_LOADED);
  user$ = this.ngrxStore.select(USER);
  userIsOwner$ = this.ngrxStore.select(
    USER_IS_OWNER_IN_CURRENT_WORKSPACE,
  );
  userRole$ = this.ngrxStore.select(ROLE_IN_CURRENT_WORKSPACE);
  memberOfGroup$ = this.ngrxStore.select(IS_MEMBER_OF_SELECTED_GROUP);
  showEditButton$ = combineLatest([
    this.selectedGroup$,
    this.selectedService$,
    this.assetsLoaded$,
  ]).pipe(
    map(([group, service, init]) => !!group && !!service && init),
  );

  saveEnabled$ = combineLatest([
    this.editMode$,
    this.userIsOwner$,
  ]).pipe(map(([editMode, isOwner]) => editMode && isOwner));

  selectedServiceName: string;
  editMode = false;
  // TODO: use a copy of the success model, which will contain changes the user made.
  // If the user does not save the changes then we reset it to the value from the store
  successModel: SuccessModel;

  dimensions = Object.keys(translationMap);

  translationMap = translationMap; // maps dimensions to their translation keys
  iconMap = iconMap; // maps dimensions to their icons

  // communityWorkspace: CommunityWorkspace;
  user;
  workspaceUser;

  saveInProgress = false;
  availableQuestionnaires: Questionnaire[];
  numberOfRequirements = 0;

  subscriptions$: Subscription[] = [];
  saveSubScription: Subscription;

  constructor(
    private translate: TranslateService,
    private snackBar: MatSnackBar,
    private ngrxStore: Store,
    private actionState: StateEffects,
  ) {}

  ngOnInit(): void {
    let sub = this.selectedService$
      .pipe(filter((service) => service !== undefined))
      .subscribe((service) => {
        this.selectedServiceName = service.alias
          ? service.alias
          : service.name;
        // this is used so that the initial success model is fetched. We should rather use a new effect for this
        // this.ngrxStore.dispatch(setService({ service }));
      });
    this.subscriptions$.push(sub);

    sub = this.user$.subscribe((user) => (this.user = user));
    this.subscriptions$.push(sub);

    sub = this.successModel$.subscribe((successModel) => {
      this.successModel = successModel;
    });
    this.subscriptions$.push(sub);

    sub = this.editMode$
      .pipe(withLatestFrom(this.successModel$, this.selectedService$))
      .subscribe(([editMode, model, service]) => {
        if (editMode && model === null) {
          // we add a new model so we create an empty one first
          this.successModel = SuccessModel.emptySuccessModel(service);
        } else if (!editMode && model == null) {
          // we disable edit mode without creating any new model
          this.successModel = model;
        }
      });
    this.subscriptions$.push(sub);

    sub = this.editMode$.subscribe((editMode) => {
      this.editMode = editMode;
    });
    this.subscriptions$.push(sub);
  }

  ngOnDestroy(): void {
    this.subscriptions$.forEach((sub) => sub.unsubscribe());
    this.ngrxStore.dispatch(disableEdit());
  }

  onServiceSelected(service: ServiceInformation): void {
    this.ngrxStore.dispatch(disableEdit());
    this.ngrxStore.dispatch(setService({ service }));
  }

  onSaveClicked(): void {
    this.saveInProgress = true;
    this.ngrxStore.dispatch(saveModelAndCatalog());
    if (this.saveInProgress) {
      this.saveSubScription = this.actionState.saveModelAndCatalog$
        .pipe(
          timeout(300000),
          catchError(() => {
            return of(
              failureResponse({
                reason: new Error(
                  'The request took too long and was aborted',
                ),
              }),
            );
          }),
        )
        .subscribe((result) => {
          this.saveInProgress = false;
          if (result.type === HttpActions.SAVE_CATALOG_SUCCESS) {
            const message = this.translate.instant(
              'success-modeling.snackbar-save-success',
            ) as string;
            this.snackBar.open(message, null, {
              duration: 2000,
            });
            this.ngrxStore.dispatch(disableEdit());
          } else {
            let message = this.translate.instant(
              'success-modeling.snackbar-save-failure',
            ) as string;
            if (result instanceof failureResponse) {
              message += (result as { reason: Error }).reason.message;
            }
            this.snackBar.open(message, 'Ok');
          }
          this.saveSubScription.unsubscribe();
        });
    }
  }

  async onExportClicked() {
    console.log(this.successModel);
    const successModelXML = await lastValueFrom(
      this.ngrxStore.select(SUCCESS_MODEL_XML).pipe(take(1)),
    );
    const blob = new Blob([successModelXML], { type: 'text/xml' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'success-model.xml';
    a.click();
    window.URL.revokeObjectURL(url);
  }
}
