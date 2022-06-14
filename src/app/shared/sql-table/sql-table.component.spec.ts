import {
  async,
  ComponentFixture,
  TestBed,
  waitForAsync,
} from '@angular/core/testing';

import { SqlTableComponent } from './sql-table.component';
import { LoggerModule, NgxLoggerLevel } from 'ngx-logger';
import { provideMockStore } from '@ngrx/store/testing';
import { initialState } from 'src/app/services/store/store.reducer';
import {
  MatDialogModule,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { of } from 'rxjs';

describe('SqlTableComponent', () => {
  let component: SqlTableComponent;
  let fixture: ComponentFixture<SqlTableComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [SqlTableComponent],
      imports: [
        LoggerModule.forRoot({
          level: NgxLoggerLevel.TRACE,
          serverLogLevel: NgxLoggerLevel.OFF,
        }),
        MatDialogModule,
      ],
      providers: [
        provideMockStore({ initialState }),
        { provide: MAT_DIALOG_DATA, useValue: [] },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SqlTableComponent);
    component = fixture.componentInstance;
    component.query$ = of('SELECT * FROM messages');
    component.service = {
      name: 'TestName',
      alias: 'TestAlias',
      mobsosIDs: {},
      serviceMessageDescriptions: {},
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
