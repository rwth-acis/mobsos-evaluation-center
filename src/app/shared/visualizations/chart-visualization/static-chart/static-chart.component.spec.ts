import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';

import { StaticChartComponent } from './static-chart.component';

describe('StaticChartComponent', () => {
  let component: StaticChartComponent;
  let fixture: ComponentFixture<StaticChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [StaticChartComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: [] },
        { provide: MatDialogRef, useValue: {} },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StaticChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
