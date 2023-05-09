import {
  ComponentFixture,
  TestBed,
  waitForAsync,
} from '@angular/core/testing';

import { SuccessMeasureComponent } from './success-measure.component';
import { LoggerModule, NgxLoggerLevel } from 'ngx-logger';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatIconModule } from '@angular/material/icon';
import {
  TranslateLoader,
  TranslateModule,
} from '@ngx-translate/core';
import { createTranslateLoader } from 'src/app/app.module';
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog';
import { provideMockStore } from '@ngrx/store/testing';
import { INITIAL_APP_STATE } from 'src/app/models/state.model';
import { SQLQuery } from 'src/app/models/measure.model';

describe('SuccessMeasureComponent', () => {
  let component: SuccessMeasureComponent;

  let fixture: ComponentFixture<SuccessMeasureComponent>;
  const initialState = INITIAL_APP_STATE;
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [SuccessMeasureComponent],
      imports: [
        LoggerModule.forRoot({
          level: NgxLoggerLevel.TRACE,
          serverLogLevel: NgxLoggerLevel.OFF,
        }),
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useFactory: createTranslateLoader,
          },
        }),
        MatDialogModule,
        MatIconModule,
        HttpClientTestingModule,
      ],
      providers: [provideMockStore({ initialState })],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SuccessMeasureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('Query.toXml should replace < and >', () => {
    const query = new SQLQuery(
      'test',
      "SELECT TIME_STAMP FROM test WHERE TIME_STAMP > '2020-01-01' and TIME_STAMP < '2021-01-01' AND REMARKS->>\"$.userID\"",
    );
    const xml = query.toXml().outerHTML;
    console.info(xml);
    expect(xml).toBe(
      `<query name="test">SELECT TIME_STAMP FROM test WHERE TIME_STAMP &gt; '2020-01-01' and TIME_STAMP &lt; '2021-01-01' AND REMARKS-&gt;&gt;"$.userID"</query>`,
    );
  });

  it('Query.fromXml should replace &gt; and &lt;', () => {
    const expectedQuery = new SQLQuery(
      'test',
      "SELECT TIME_STAMP FROM test WHERE TIME_STAMP > '2020-01-01' and TIME_STAMP < '2021-01-01' AND REMARKS->>\"$.userID\"",
    );

    const doc = document.implementation.createDocument('', '', null);
    const element = doc.createElement('query');
    element.setAttribute('name', 'test');
    element.innerHTML = `SELECT TIME_STAMP FROM test WHERE TIME_STAMP &gt; '2020-01-01' and TIME_STAMP &lt; '2021-01-01' AND REMARKS-&gt;&gt;"$.userID"`;
    const query = SQLQuery.fromXml(element);
    expect(query).toEqual(expectedQuery);
  });
});
