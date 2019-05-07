import {Visualization} from "./visualization";

export class KpiVisualization extends Visualization{
    type = 'KPI';

    static fromXml(xml: Element): KpiVisualization{
      return null;
    }

    toXml(){

    }
}
