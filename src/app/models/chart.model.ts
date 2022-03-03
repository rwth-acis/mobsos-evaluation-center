import { Formatter } from 'angular-google-charts';

export class ChartData {
  constructor(
    public title: string,
    public chartType: string,
    public data: any[][],
    public columns: string[],
    public options: Record<string, unknown>,
    public formatters?: Formatter[],
  ) {}
}
