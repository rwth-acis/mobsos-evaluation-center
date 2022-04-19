import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import {
  distinctUntilKeyChanged,
  filter,
  firstValueFrom,
  take,
  withLatestFrom,
} from 'rxjs';
import { Las2peerService } from 'src/app/services/las2peer.service';
import {
  disableEdit,
  fetchGroups,
  fetchMeasureCatalog,
  fetchMessageDescriptions,
  fetchQuestionnaires,
  fetchServices,
  fetchSuccessModel,
  fetchSurveys,
  joinWorkSpace,
  setCommunityWorkspaceOwner,
  storeUser,
} from 'src/app/services/store/store.actions';
import {
  USER,
  SELECTED_GROUP,
  NUMBER_OF_REQUIREMENTS,
  _SELECTED_GROUP_ID,
  _SELECTED_SERVICE_NAME,
} from 'src/app/services/store/store.selectors';
import { _timeout } from 'src/app/shared/custom-utils';
import { UnavailableServicesDialogComponent } from 'src/app/shared/dialogs/unavailable-services-dialog/unavailable-services-dialog.component';

@Component({
  selector: 'app-success-modeling',
  templateUrl: './success-modeling.component.html',
  styleUrls: ['./success-modeling.component.scss'],
})
export class SuccessModelingComponent implements OnInit {
  @Input() restricted = false;

  successModelingAvailable = true;
  contactServiceAvailable = true;

  user$ = this.ngrxStore.select(USER);
  selectedGroup$ = this.ngrxStore.select(SELECTED_GROUP);
  numberOfRequirements$ = this.ngrxStore.select(
    NUMBER_OF_REQUIREMENTS,
  );
  noobInfo: boolean;
  constructor(
    private ngrxStore: Store,
    private l2p: Las2peerService,
    private dialog: MatDialog,
  ) {}

  async ngOnInit(): Promise<void> {
    const noob = localStorage.getItem('notNewbie');
    this.noobInfo = noob == null;
    void firstValueFrom(
      this.l2p.authenticateOnReqBaz().pipe(take(1)),
    );
    this.ngrxStore.dispatch(disableEdit());
    await this.checkCoreServices();

    const [user, groupId, serviceName] = await firstValueFrom(
      this.user$.pipe(
        filter((u) => !!u?.signedIn),
        distinctUntilKeyChanged('signedIn'),
        withLatestFrom(
          this.ngrxStore.select(_SELECTED_GROUP_ID),
          this.ngrxStore.select(_SELECTED_SERVICE_NAME),
        ),
        take(1),
      ),
    );

    // only gets called ONCE if user is signed in
    // initial fetching
    this.ngrxStore.dispatch(fetchGroups());
    this.ngrxStore.dispatch(fetchServices());

    if (!groupId) return;
    this.ngrxStore.dispatch(fetchMeasureCatalog({ groupId }));

    this.ngrxStore.dispatch(
      setCommunityWorkspaceOwner({
        owner: user.profile.preferred_username,
      }),
    );

    if (!serviceName) return;
    this.ngrxStore.dispatch(joinWorkSpace({ groupId, serviceName }));
    this.ngrxStore.dispatch(
      fetchSuccessModel({ groupId, serviceName }),
    );
    this.ngrxStore.dispatch(
      fetchMessageDescriptions({
        serviceName,
      }),
    );
    await _timeout(3000);

    const authorized = await firstValueFrom(
      this.l2p.checkAuthorization(),
    );
    if (!authorized) {
      alert(
        'You are logged in, but las2peer could not authorize you. This most likely means that your agent could not be found. Please contact the administrator.',
      );
      this.ngrxStore.dispatch(storeUser({ user: null }));
    }
  }

  dismissNoobInfo(remember = false) {
    this.noobInfo = false;
    if (remember) {
      localStorage.setItem('notNewbie', 'true');
    }
  }

  async checkCoreServices(): Promise<void> {
    await firstValueFrom(this.l2p.checkServiceAvailability());
    const unavailableServices = this.l2p.unavailableServices.map(
      (service) => {
        return { name: service.name, reason: service.reason };
      },
    );
    if (unavailableServices.length > 0) {
      console.warn(
        'Some services are unavailable: ',
        unavailableServices,
      );
      this.dialog.open(UnavailableServicesDialogComponent, {
        data: {
          services: unavailableServices,
        },
      });
      this.successModelingAvailable =
        this.l2p.successModelingIsAvailable;
      this.contactServiceAvailable =
        this.l2p.contactserviceIsAvailable;
    }
  }
}
