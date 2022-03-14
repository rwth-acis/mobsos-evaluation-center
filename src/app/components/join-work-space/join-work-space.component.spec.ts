import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JoinWorkSpaceComponent } from './join-work-space.component';

describe('JoinWorkSpaceComponent', () => {
  let component: JoinWorkSpaceComponent;
  let fixture: ComponentFixture<JoinWorkSpaceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ JoinWorkSpaceComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(JoinWorkSpaceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
