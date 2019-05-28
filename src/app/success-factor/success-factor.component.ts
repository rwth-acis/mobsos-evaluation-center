import {Component, Input, OnInit} from '@angular/core';
import {ServiceInformation} from "../store.service";
import {MeasureMap} from "../../success-model/measure-catalog";
import {SuccessFactor} from "../../success-model/success-factor";

@Component({
  selector: 'app-success-factor',
  templateUrl: './success-factor.component.html',
  styleUrls: ['./success-factor.component.scss']
})
export class SuccessFactorComponent implements OnInit {
  @Input() factor: SuccessFactor;
  @Input() service: ServiceInformation;
  @Input() measures: MeasureMap;

  constructor() { }

  ngOnInit() {
  }

}
