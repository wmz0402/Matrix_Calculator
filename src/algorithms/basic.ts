import { dimensionMismatch, MatrixError, requireSquare } from "../core/errors";
import { Matrix } from "../core/matrix";
import { Rational } from "../core/rational";
import { inverse } from "./inverse";

export const MAX_ABS_EXPONENT = 10_000;

function requireSameShape(left: Matrix, right: Matrix, operation: string): void {
  if (left.rows !== right.rows || left.cols !== right.cols) {
    dimensionMismatch(`${operation}要求两个矩阵尺寸相同`, {
      left: [left.rows, left.cols],
      right: [right.rows, right.cols],
    });
  }
}

export function add(left: Matrix, right: Matrix): Matrix {
  requireSameShape(left, right, "矩阵加法");
  return left.map((value, row, col) => value.add(right.get(row, col)));
}

export function subtract(left: Matrix, right: Matrix): Matrix {
  requireSameShape(left, right, "矩阵减法");
  return left.map((value, row, col) => value.subtract(right.get(row, col)));
}

export function scale(matrix: Matrix, scalar: Rational): Matrix {
  return matrix.map((value) => value.multiply(scalar));
}

export function multiply(left: Matrix, right: Matrix): Matrix {
  if (left.cols !== right.rows) {
    dimensionMismatch("矩阵乘法要求左矩阵列数等于右矩阵行数", {
      left: [left.rows, left.cols],
      right: [right.rows, right.cols],
    });
  }

  const values: Rational[] = [];
  for (let row = 0; row < left.rows; row += 1) {
    for (let col = 0; col < right.cols; col += 1) {
      let sum = Rational.ZERO;
      for (let inner = 0; inner < left.cols; inner += 1) {
        sum = sum.add(left.get(row, inner).multiply(right.get(inner, col)));
      }
      values.push(sum);
    }
  }
  return Matrix.fromFlat(left.rows, right.cols, values);
}

export function transpose(matrix: Matrix): Matrix {
  const values: Rational[] = [];
  for (let row = 0; row < matrix.cols; row += 1) {
    for (let col = 0; col < matrix.rows; col += 1) values.push(matrix.get(col, row));
  }
  return Matrix.fromFlat(matrix.cols, matrix.rows, values);
}

export function trace(matrix: Matrix): Rational {
  requireSquare(matrix.rows, matrix.cols, "迹");
  let result = Rational.ZERO;
  for (let index = 0; index < matrix.rows; index += 1) {
    result = result.add(matrix.get(index, index));
  }
  return result;
}

export function power(matrix: Matrix, exponent: number): Matrix {
  requireSquare(matrix.rows, matrix.cols, "幂运算");
  if (!Number.isSafeInteger(exponent)) {
    throw new MatrixError("INVALID_EXPONENT", "幂必须是安全整数", { exponent });
  }
  if (Math.abs(exponent) > MAX_ABS_EXPONENT) {
    throw new MatrixError(
      "RESOURCE_LIMIT",
      `幂的绝对值不能超过 ${MAX_ABS_EXPONENT}`,
      { exponent, limit: MAX_ABS_EXPONENT },
    );
  }
  if (exponent === 0) return Matrix.identity(matrix.rows);

  let base = exponent < 0 ? inverse(matrix).inverse : matrix;
  let remaining = Math.abs(exponent);
  let result = Matrix.identity(matrix.rows);
  while (remaining > 0) {
    if (remaining % 2 === 1) result = multiply(result, base);
    remaining = Math.floor(remaining / 2);
    if (remaining > 0) base = multiply(base, base);
  }
  return result;
}
