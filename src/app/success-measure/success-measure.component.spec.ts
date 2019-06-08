import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {SuccessMeasureComponent} from './success-measure.component';
import {LoggerModule, NgxLoggerLevel} from 'ngx-logger';
import {MatDialogModule} from '@angular/material';
import {HttpClientTestingModule} from '@angular/common/http/testing';

describe('SuccessMeasureComponent', () => {
  let component: SuccessMeasureComponent;
  let fixture: ComponentFixture<SuccessMeasureComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SuccessMeasureComponent],
      imports: [
        LoggerModule.forRoot({
          level: NgxLoggerLevel.TRACE,
          serverLogLevel: NgxLoggerLevel.OFF
        }),
        MatDialogModule,
        HttpClientTestingModule,
      ],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SuccessMeasureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
