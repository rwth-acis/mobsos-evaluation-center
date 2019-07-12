import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RequirementsListComponent } from './requirements-list.component';

describe('RequirementsListComponent', () => {
  let component: RequirementsListComponent;
  let fixture: ComponentFixture<RequirementsListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RequirementsListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RequirementsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
