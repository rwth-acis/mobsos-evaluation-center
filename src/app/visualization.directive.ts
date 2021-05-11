import {Directive, ViewContainerRef} from '@angular/core';

@Directive({
  selector: '[appVisualization]', exportAs:'visualizationHost'
})
export class VisualizationDirective {

  constructor(public viewContainerRef: ViewContainerRef) { }

}
