import {Component, Input, OnInit} from '@angular/core';
import {SuccessFactor} from '../../success-model/success-factor';
import {MeasureMap} from '../../success-model/measure-catalog';
import {Las2peerService} from '../las2peer.service';

@Component({
  selector: 'app-success-dimension',
  templateUrl: './success-dimension.component.html',
  styleUrls: ['./success-dimension.component.scss']
})
export class SuccessDimensionComponent implements OnInit {
  private _factors: SuccessFactor[];

  @Input() set factors(factors: SuccessFactor[]) {
    this._factors = factors;
  }

  get factors(){
    return this._factors;
  }

  @Input() measures: MeasureMap;
  @Input() name: string;
  @Input() description: string;
  @Input() icon: string;

  constructor(private las2peer: Las2peerService) {
  }

  ngOnInit() {
  }

}
