import { Pipe, PipeTransform } from '@angular/core';
import { evaluate, MathExpression, round } from 'mathjs';
/**
 * Pipe to evaluate a math expression.
 * Takes an expression as string or an array of expressions as input and returns the result.
 * Usage:
 *  expression | evaluate: scope
 * Example:
 *  a*b^2 | evaluate: {a: 2, b: 3} // evaluates to 18
 *  */
@Pipe({
  name: 'evaluate',
})
export class EvaluatePipe implements PipeTransform {
  /**
   * Transforms the expression into a result.
   *
   * @param exprs an expression to evaluate
   * @param scope the scope to use for the evaluation each variable must be mapped to a number
   * @returns the result of the evaluation
   */
  transform(exprs: MathExpression, scope: Scope): any {
    // if (Array.isArray(exprs)) {
    //   return exprs.map(expr => evaluate(expr, scope));
    // } // array support disabled for now
    const result = evaluate(exprs, scope);
    return round(result, 2);
  }
}
interface Scope {
  [key: string]: number;
}
