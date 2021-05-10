import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {SqlTableComponent} from './sql-table.component';
import {LoggerModule, NgxLoggerLevel} from 'ngx-logger';

describe('SqlTableComponent', () => {
  let component: SqlTableComponent;
  let fixture: ComponentFixture<SqlTableComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SqlTableComponent],
      imports: [
        LoggerModule.forRoot({
          level: NgxLoggerLevel.TRACE,
          serverLogLevel: NgxLoggerLevel.OFF
        }),
      ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SqlTableComponent);
    component = fixture.componentInstance;
    component.query = 'SELECT * FROM messages';
    component.service = {
      name: 'TestName',
      alias: 'TestAlias',
      mobsosIDs: [],
      serviceMessageDescriptions: {}
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
