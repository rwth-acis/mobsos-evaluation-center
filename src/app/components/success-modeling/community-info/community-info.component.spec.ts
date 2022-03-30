import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommunityInfoComponent } from './community-info.component';

describe('CommunityInfoComponent', () => {
  let component: CommunityInfoComponent;
  let fixture: ComponentFixture<CommunityInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CommunityInfoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CommunityInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
