import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-visualization-info',
  templateUrl: './visualization-info.component.html',
  styleUrls: ['./visualization-info.component.scss'],
})
export class VisualizationInfoComponent implements OnInit {
  @Input() fetchDate: string;
  @Input() fetchError: string;
  @Input() description: string;

  constructor() {}

  ngOnInit(): void {}
}
