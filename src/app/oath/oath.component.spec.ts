import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OathComponent } from './oath.component';

describe('OathComponent', () => {
  let component: OathComponent;
  let fixture: ComponentFixture<OathComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OathComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OathComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
