import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnavailableServicesDialogComponent } from './unavailable-services-dialog.component';

describe('UnavailableServicesDialogComponent', () => {
  let component: UnavailableServicesDialogComponent;
  let fixture: ComponentFixture<UnavailableServicesDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UnavailableServicesDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UnavailableServicesDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
