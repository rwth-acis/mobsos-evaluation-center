import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {OidcSigninComponent} from './oidc-signin.component';

describe('OidcSigninComponent', () => {
  let component: OidcSigninComponent;
  let fixture: ComponentFixture<OidcSigninComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [OidcSigninComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OidcSigninComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
