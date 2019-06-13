import { TestBed } from '@angular/core/testing';

import { YJsService } from './y-js.service';

describe('YJsService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: YJsService = TestBed.get(YJsService);
    expect(service).toBeTruthy();
  });
});
