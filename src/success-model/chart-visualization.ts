import {Visualization} from "./visualization";

export class ChartVisualization extends Visualization {

  constructor(public chartType: string, public nodeId: string, public title: string, public height: string,
              public width: string) {
    super();
  }

  static fromXml(xml: Element): ChartVisualization {
    return null;
  }

  toXml() {

  }
}
