import { Pipe, PipeTransform } from '@angular/core';
import { parse } from 'mathjs';
import katex from 'katex';
@Pipe({
  name: 'latex',
})
export class LatexPipe implements PipeTransform {
  /**
   * Renders a math expression into a latex html string
   *
   * @param expression
   * @returns
   */
  transform(expression: string): unknown {
    const tex = parse(expression).toTex();
    return katex.renderToString(tex); // fractions are not displayed correctly
  }
}
