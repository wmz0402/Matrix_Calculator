import { requireSquare } from "../core/errors";
import { Matrix } from "../core/matrix";
import { Rational } from "../core/rational";

export function determinant(matrix: Matrix): Rational {
  requireSquare(matrix.rows, matrix.cols, "行列式");
  const size = matrix.rows;
  if (size === 0) return Rational.ONE;
  if (size === 1) return matrix.get(0, 0);

  const rows = matrix.toRows();
  let sign = Rational.ONE;
  let previousPivot = Rational.ONE;

  for (let pivotIndex = 0; pivotIndex < size - 1; pivotIndex += 1) {
    let pivotRow = pivotIndex;
    while (pivotRow < size && rows[pivotRow]![pivotIndex]!.isZero()) pivotRow += 1;
    if (pivotRow === size) return Rational.ZERO;

    if (pivotRow !== pivotIndex) {
      [rows[pivotIndex], rows[pivotRow]] = [rows[pivotRow]!, rows[pivotIndex]!];
      sign = sign.negate();
    }

    const pivot = rows[pivotIndex]![pivotIndex]!;
    for (let row = pivotIndex + 1; row < size; row += 1) {
      for (let col = pivotIndex + 1; col < size; col += 1) {
        const numerator = rows[row]![col]!
          .multiply(pivot)
          .subtract(rows[row]![pivotIndex]!.multiply(rows[pivotIndex]![col]!));
        rows[row]![col] = numerator.divide(previousPivot);
      }
      rows[row]![pivotIndex] = Rational.ZERO;
    }
    previousPivot = pivot;
  }

  return sign.multiply(rows[size - 1]![size - 1]!);
}
