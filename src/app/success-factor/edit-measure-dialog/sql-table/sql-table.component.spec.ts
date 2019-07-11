import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SqlTableComponent } from './sql-table.component';

describe('SqlTableComponent', () => {
  let component: SqlTableComponent;
  let fixture: ComponentFixture<SqlTableComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SqlTableComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SqlTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
