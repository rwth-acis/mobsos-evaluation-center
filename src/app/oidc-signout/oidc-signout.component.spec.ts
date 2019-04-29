import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {OidcSignoutComponent} from './oidc-signout.component';

describe('OidcSignoutComponent', () => {
  let component: OidcSignoutComponent;
  let fixture: ComponentFixture<OidcSignoutComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [OidcSignoutComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OidcSignoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
