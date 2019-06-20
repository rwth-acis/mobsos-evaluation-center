import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddFactorDialogComponent } from './add-factor-dialog.component';

describe('AddFactorDialogComponent', () => {
  let component: AddFactorDialogComponent;
  let fixture: ComponentFixture<AddFactorDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddFactorDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddFactorDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
