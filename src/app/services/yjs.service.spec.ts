import { TestBed } from '@angular/core/testing';

import { YjsService } from './yjs.service';

describe('YjsService', () => {
  let service: YjsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(YjsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
