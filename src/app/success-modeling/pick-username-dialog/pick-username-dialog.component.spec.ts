import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PickUsernameDialogComponent } from './pick-username-dialog.component';

describe('PickUsernameDialogComponent', () => {
  let component: PickUsernameDialogComponent;
  let fixture: ComponentFixture<PickUsernameDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PickUsernameDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PickUsernameDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
