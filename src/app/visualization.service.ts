import {ComponentFactoryResolver, Inject, Injectable, ViewContainerRef} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class VisualizationService {

  constructor(@Inject(ComponentFactoryResolver) private factoryResolver) {

  }

}
