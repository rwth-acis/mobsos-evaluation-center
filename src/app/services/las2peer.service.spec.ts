import { TestBed } from '@angular/core/testing';

import { Las2peerService } from './las2peer.service';
import { LoggerModule, NgxLoggerLevel } from 'ngx-logger';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('Las2peerService', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [
        LoggerModule.forRoot({
          level: NgxLoggerLevel.TRACE,
          serverLogLevel: NgxLoggerLevel.OFF,
        }),
        HttpClientTestingModule,
      ],
    })
  );

  it('should be created', () => {
    const service: Las2peerService = TestBed.inject(Las2peerService);
    expect(service).toBeTruthy();
  });
});
