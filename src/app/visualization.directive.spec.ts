import {VisualizationDirective} from './visualization.directive';
import {
  ComponentFactory,
  ComponentRef,
  ElementRef,
  EmbeddedViewRef,
  Injector,
  NgModuleRef,
  TemplateRef,
  ViewContainerRef,
  ViewRef
} from '@angular/core';

export class MockElementRef extends ViewContainerRef {

  readonly element: ElementRef;
  readonly injector: Injector;
  readonly length: number;
  readonly parentInjector: Injector;

  clear(): void {
  }

  createComponent<C>(componentFactory: ComponentFactory<C>, index?: number, injector?: Injector,
                     projectableNodes?: any[][], ngModule?: NgModuleRef<any>): ComponentRef<C> {
    return undefined;
  }

  createEmbeddedView<C>(templateRef: TemplateRef<C>, context?: C, index?: number): EmbeddedViewRef<C> {
    return undefined;
  }

  detach(index?: number): ViewRef | null {
    return undefined;
  }

  get(index: number): ViewRef | null {
    return undefined;
  }

  indexOf(viewRef: ViewRef): number {
    return 0;
  }

  insert(viewRef: ViewRef, index?: number): ViewRef {
    return undefined;
  }

  move(viewRef: ViewRef, currentIndex: number): ViewRef {
    return undefined;
  }

  remove(index?: number): void {
  }
}

describe('VisualizationDirective', () => {
  it('should create an instance', () => {
    const directive = new VisualizationDirective(new MockElementRef());
    expect(directive).toBeTruthy();
  });
});
