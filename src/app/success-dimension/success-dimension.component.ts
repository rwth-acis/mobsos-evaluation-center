import {Component, Input, OnInit} from '@angular/core';

@Component({
  selector: 'app-success-dimension',
  templateUrl: './success-dimension.component.html',
  styleUrls: ['./success-dimension.component.scss']
})
export class SuccessDimensionComponent implements OnInit {
  @Input() name: string;
  @Input() description: string;
  @Input() icon: string;

  constructor() { }

  ngOnInit() {
  }

}
