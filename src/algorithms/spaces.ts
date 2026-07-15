import { Matrix } from "../core/matrix";
import { Rational } from "../core/rational";
import { eliminate } from "./elimination";

export interface BasisResult {
  readonly basis: Matrix;
  readonly dimension: number;
  readonly pivotColumns: readonly number[];
}

export function rank(matrix: Matrix): number {
  return eliminate(matrix, { form: "ref" }).rank;
}

export function nullSpace(matrix: Matrix): BasisResult {
  const result = eliminate(matrix, { form: "rref" });
  const pivotSet = new Set(result.pivotColumns);
  const freeColumns = Array.from({ length: matrix.cols }, (_, col) => col).filter(
    (col) => !pivotSet.has(col),
  );
  const values = Array<Rational>(matrix.cols * freeColumns.length).fill(Rational.ZERO);

  freeColumns.forEach((freeCol, basisIndex) => {
    values[freeCol * freeColumns.length + basisIndex] = Rational.ONE;
    result.pivotColumns.forEach((pivotCol, pivotRow) => {
      values[pivotCol * freeColumns.length + basisIndex] = result.matrix
        .get(pivotRow, freeCol)
        .negate();
    });
  });

  return {
    basis: Matrix.fromFlat(matrix.cols, freeColumns.length, values),
    dimension: freeColumns.length,
    pivotColumns: result.pivotColumns,
  };
}

export function columnSpace(matrix: Matrix): BasisResult {
  const result = eliminate(matrix, { form: "ref" });
  return {
    basis: matrix.selectColumns(result.pivotColumns),
    dimension: result.rank,
    pivotColumns: result.pivotColumns,
  };
}

export function rowSpace(matrix: Matrix): BasisResult {
  const result = eliminate(matrix, { form: "rref" });
  const rowIndices = Array.from({ length: result.rank }, (_, index) => index);
  return {
    basis: result.matrix.selectRows(rowIndices),
    dimension: result.rank,
    pivotColumns: result.pivotColumns,
  };
}
