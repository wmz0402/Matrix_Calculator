import { requireSquare } from "../core/errors";
import { Matrix } from "../core/matrix";
import { Rational } from "../core/rational";
import { add, multiply, scale, trace } from "./basic";

/**
 * 返回 det(λI - A) 的系数，按次数从高到低排列。
 * 使用 Faddeev-LeVerrier 算法，整个过程保持有理数精确性。
 */
export function characteristicPolynomial(matrix: Matrix): readonly Rational[] {
  requireSquare(matrix.rows, matrix.cols, "特征多项式");
  const size = matrix.rows;
  if (size === 0) return [Rational.ONE];

  const identity = Matrix.identity(size);
  const coefficients: Rational[] = [Rational.ONE];
  let previous = identity;
  for (let degree = 1; degree <= size; degree += 1) {
    const product = multiply(matrix, previous);
    const coefficient = trace(product)
      .divide(Rational.fromInteger(degree))
      .negate();
    coefficients.push(coefficient);
    previous = add(product, scale(identity, coefficient));
  }
  return coefficients;
}
