import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {SuccessFactor} from '../../success-model/success-factor';
import {MeasureMap} from '../../success-model/measure-catalog';
import {Las2peerService} from '../las2peer.service';
import {ValueVisualization} from "../../success-model/visualization";
import {ServiceInformation} from "../store.service";

@Component({
  selector: 'app-success-dimension',
  templateUrl: './success-dimension.component.html',
  styleUrls: ['./success-dimension.component.scss']
})
export class SuccessDimensionComponent implements OnInit {
  @Input() measures: MeasureMap;
  @Input() service: ServiceInformation;
  @Input() name: string;
  @Input() description: string;
  @Input() icon: string;

  constructor() {
  }

  private _factors: SuccessFactor[];

  get factors() {
    return this._factors;
  }

  @Input() set factors(factors: SuccessFactor[]) {
    this._factors = factors;
  }

  ngOnInit() {

  }
}
