import { TestBed } from '@angular/core/testing';

import { Las2peerService } from './las2peer.service';

describe('Las2peerService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: Las2peerService = TestBed.get(Las2peerService);
    expect(service).toBeTruthy();
  });
});
