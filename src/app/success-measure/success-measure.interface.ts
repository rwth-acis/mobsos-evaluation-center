/**
 * The interface exists mainly to prevent circular imports between the SuccessMeasureComponent and other components.
 */
export interface SuccessMeasureInterface {
  refreshVisualization(): void;
  rerenderVisualizationComponent(): void;
}
