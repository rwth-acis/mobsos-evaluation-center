import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PickReqbazProjectComponent } from './pick-reqbaz-project.component';

describe('PickReqbazProjectComponent', () => {
  let component: PickReqbazProjectComponent;
  let fixture: ComponentFixture<PickReqbazProjectComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PickReqbazProjectComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PickReqbazProjectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
