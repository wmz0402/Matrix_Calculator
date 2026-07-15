import { requireSquare } from "../core/errors";
import { Matrix } from "../core/matrix";

export interface PluResult {
  readonly permutation: Matrix;
  readonly lower: Matrix;
  readonly upper: Matrix;
  readonly singular: boolean;
}

export function plu(matrix: Matrix): PluResult {
  requireSquare(matrix.rows, matrix.cols, "PLU 分解");
  const size = matrix.rows;
  const upper = matrix.toRows();
  const lower = Matrix.identity(size).toRows();
  const permutation = Matrix.identity(size).toRows();

  for (let pivotCol = 0; pivotCol < size; pivotCol += 1) {
    let pivotRow = pivotCol;
    while (pivotRow < size && upper[pivotRow]![pivotCol]!.isZero()) pivotRow += 1;
    if (pivotRow === size) continue;

    if (pivotRow !== pivotCol) {
      [upper[pivotCol], upper[pivotRow]] = [upper[pivotRow]!, upper[pivotCol]!];
      [permutation[pivotCol], permutation[pivotRow]] = [
        permutation[pivotRow]!,
        permutation[pivotCol]!,
      ];
      for (let col = 0; col < pivotCol; col += 1) {
        [lower[pivotCol]![col], lower[pivotRow]![col]] = [
          lower[pivotRow]![col]!,
          lower[pivotCol]![col]!,
        ];
      }
    }

    const pivot = upper[pivotCol]![pivotCol]!;
    for (let row = pivotCol + 1; row < size; row += 1) {
      const factor = upper[row]![pivotCol]!.divide(pivot);
      lower[row]![pivotCol] = factor;
      for (let col = pivotCol; col < size; col += 1) {
        upper[row]![col] = upper[row]![col]!.subtract(
          factor.multiply(upper[pivotCol]![col]!),
        );
      }
    }
  }

  const upperMatrix = Matrix.fromFlat(size, size, upper.flat());
  let singular = false;
  for (let index = 0; index < size; index += 1) {
    if (upperMatrix.get(index, index).isZero()) {
      singular = true;
      break;
    }
  }

  return {
    permutation: Matrix.fromFlat(size, size, permutation.flat()),
    lower: Matrix.fromFlat(size, size, lower.flat()),
    upper: upperMatrix,
    singular,
  };
}
