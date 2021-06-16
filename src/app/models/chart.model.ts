export class GoogleChart {
  constructor(
    public title: string,
    public chartType: string,
    public data: any[][],
    public columns: string[],
    public options: object
  ) {}
}
