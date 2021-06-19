import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { joinAsVisitor } from '../services/store.actions';
/**
 * Used to join the workspace of another user by url. Url should be of the following format: /join/:groupId/:serviceName/:username
 */
@Component({
  selector: 'app-join-work-space',
  templateUrl: './join-work-space.component.html',
  styleUrls: ['./join-work-space.component.scss'],
})
export class JoinWorkSpaceComponent implements OnInit, OnDestroy {
  constructor(
    private route: ActivatedRoute,
    private ngrxStore: Store,
    private router: Router,
  ) {}
  groupId$: Observable<string>;
  serviceName$: Observable<string>;
  subscription$: Subscription;

  ngOnInit(): void {
    this.subscription$ = this.route.params.subscribe(
      (params: {
        groupId: string;
        serviceName: string;
        username: string;
      }) => {
        this.ngrxStore.dispatch(
          joinAsVisitor({
            groupId: params.groupId,
            serviceName: params.serviceName,
            owner: params.username,
          }),
        );
        this.router.navigateByUrl('/visitor');
      },
    );
  }

  ngOnDestroy() {
    this.subscription$.unsubscribe();
  }
}
