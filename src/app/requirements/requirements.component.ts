import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Apollo, gql } from 'apollo-angular';
import { Observable } from 'rxjs';
import { SUCCESS_MODEL } from '../services/store.selectors';

@Component({
  selector: 'app-requirements',
  templateUrl: './requirements.component.html',
  styleUrls: ['./requirements.component.scss'],
})
export class RequirementsComponent implements OnInit {
  repositories$: Observable<object>;
  successModel$ = this.ngrxStore.select(SUCCESS_MODEL);
  constructor(private ngrxStore: Store, private apollo: Apollo) {}

  ngOnInit(): void {
    this.repositories$ = this.apollo.query({
      query: gql`
        {
          organization(login: "rwth-acis") {
            description
            repository(name: "mobsos-evaluation-center") {
              description
            }
          }
        }
      `,
    });
  }
  openLink(event: MouseEvent): void {
    event.preventDefault();
  }
}
