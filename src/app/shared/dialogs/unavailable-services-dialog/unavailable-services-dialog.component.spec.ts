import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/legacy-dialog';

import { UnavailableServicesDialogComponent } from './unavailable-services-dialog.component';

describe('UnavailableServicesDialogComponent', () => {
  let component: UnavailableServicesDialogComponent;
  let fixture: ComponentFixture<UnavailableServicesDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UnavailableServicesDialogComponent],
      providers: [{ provide: MAT_DIALOG_DATA, useValue: [] }],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(
      UnavailableServicesDialogComponent,
    );
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
