import { TestBed } from '@angular/core/testing';

import { WorkspaceServiceService } from './workspace-service.service';

describe('WorkspaceServiceService', () => {
  let service: WorkspaceServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WorkspaceServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
