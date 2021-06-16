import { TestBed } from '@angular/core/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { INITIAL_APP_STATE } from '../models/state.model';

import { WorkspaceService } from './workspace.service';

describe('WorkspaceServiceService', () => {
  let service: WorkspaceService;
  const initialState = INITIAL_APP_STATE;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideMockStore({ initialState })],
    });
    service = TestBed.inject(WorkspaceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
