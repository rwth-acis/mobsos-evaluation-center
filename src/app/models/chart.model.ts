import { Formatter } from 'angular-google-charts';
/**
 * Object which contains the data required as input for google charts
 */

export interface ChartData {
  title: string; // Title of the chart
  chartType: string; // Type of chart
  data: any[][]; // Data for the chart
  options: object; // Options for the chart
  columnNames: string[]; // Column names for the chart
  formatters?: Formatter[]; // Formats for the columns
}
export class ChartData implements ChartData {
  constructor(
    public title: string,
    public chartType: string,
    public data: any[][],
    public columnNames: string[],
    public options: object,
    public formatters?: Formatter[],
  ) {}
}
