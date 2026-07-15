import { MatrixError, requireSquare } from "../core/errors";
import { Matrix } from "../core/matrix";
import { Rational } from "../core/rational";
import { scale } from "./basic";
import { determinant } from "./determinant";
import { inverse } from "./inverse";
import { rank } from "./spaces";

const MAX_SINGULAR_COFACTOR_SIZE = 8;

function minor(matrix: Matrix, removedRow: number, removedCol: number): Matrix {
  const values: Rational[] = [];
  for (let row = 0; row < matrix.rows; row += 1) {
    if (row === removedRow) continue;
    for (let col = 0; col < matrix.cols; col += 1) {
      if (col !== removedCol) values.push(matrix.get(row, col));
    }
  }
  return Matrix.fromFlat(matrix.rows - 1, matrix.cols - 1, values);
}

export function adjugate(matrix: Matrix): Matrix {
  requireSquare(matrix.rows, matrix.cols, "伴随矩阵");
  const size = matrix.rows;
  if (size === 0) return Matrix.fromFlat(0, 0, []);
  if (size === 1) return Matrix.fromRows([[Rational.ONE]]);

  const det = determinant(matrix);
  if (!det.isZero()) return scale(inverse(matrix).inverse, det);
  if (rank(matrix) <= size - 2) return Matrix.zeros(size, size);
  if (size > MAX_SINGULAR_COFACTOR_SIZE) {
    throw new MatrixError(
      "RESOURCE_LIMIT",
      `奇异矩阵的伴随矩阵目前最多支持 ${MAX_SINGULAR_COFACTOR_SIZE} 阶`,
      { size, limit: MAX_SINGULAR_COFACTOR_SIZE },
    );
  }

  const values: Rational[] = [];
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      const cofactor = determinant(minor(matrix, col, row));
      values.push((row + col) % 2 === 0 ? cofactor : cofactor.negate());
    }
  }
  return Matrix.fromFlat(size, size, values);
}
