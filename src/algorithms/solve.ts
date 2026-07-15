import { dimensionMismatch } from "../core/errors";
import { Matrix } from "../core/matrix";
import { Rational } from "../core/rational";
import { eliminate, type RowOperation } from "./elimination";

interface SolveOptions {
  readonly trace?: boolean;
  readonly maxTraceSteps?: number;
}

interface SolveResultBase {
  readonly rref: Matrix;
  readonly pivotColumns: readonly number[];
  readonly operations: readonly RowOperation[];
  readonly traceTruncated: boolean;
}

export interface UniqueSolution extends SolveResultBase {
  readonly kind: "unique";
  readonly solution: Matrix;
}

export interface InfiniteSolution extends SolveResultBase {
  readonly kind: "infinite";
  readonly particular: Matrix;
  readonly nullSpaceBasis: Matrix;
  readonly freeColumns: readonly number[];
}

export interface InconsistentSolution extends SolveResultBase {
  readonly kind: "inconsistent";
  readonly inconsistentRightHandSides: readonly number[];
}

export type SolveResult = UniqueSolution | InfiniteSolution | InconsistentSolution;

export function solve(left: Matrix, right: Matrix, options: SolveOptions = {}): SolveResult {
  if (left.rows !== right.rows) {
    dimensionMismatch("系数矩阵与右端矩阵的行数必须一致", {
      leftRows: left.rows,
      rightRows: right.rows,
    });
  }

  const variableCount = left.cols;
  const augmented = left.augment(right);
  const result = eliminate(augmented, {
    form: "rref",
    pivotColumnLimit: variableCount,
    trace: options.trace,
    maxTraceSteps: options.maxTraceSteps,
  });
  const base: SolveResultBase = {
    rref: result.matrix,
    pivotColumns: result.pivotColumns,
    operations: result.operations,
    traceTruncated: result.traceTruncated,
  };

  const inconsistentRightHandSides: number[] = [];
  for (let rhs = 0; rhs < right.cols; rhs += 1) {
    for (let row = 0; row < left.rows; row += 1) {
      let zeroCoefficientRow = true;
      for (let col = 0; col < variableCount; col += 1) {
        if (!result.matrix.get(row, col).isZero()) {
          zeroCoefficientRow = false;
          break;
        }
      }
      if (zeroCoefficientRow && !result.matrix.get(row, variableCount + rhs).isZero()) {
        inconsistentRightHandSides.push(rhs);
        break;
      }
    }
  }
  if (inconsistentRightHandSides.length > 0) {
    return { kind: "inconsistent", inconsistentRightHandSides, ...base };
  }

  const particularValues = Array<Rational>(variableCount * right.cols).fill(Rational.ZERO);
  result.pivotColumns.forEach((pivotCol, pivotRow) => {
    for (let rhs = 0; rhs < right.cols; rhs += 1) {
      particularValues[pivotCol * right.cols + rhs] = result.matrix.get(
        pivotRow,
        variableCount + rhs,
      );
    }
  });
  const particular = Matrix.fromFlat(variableCount, right.cols, particularValues);

  const pivotSet = new Set(result.pivotColumns);
  const freeColumns = Array.from({ length: variableCount }, (_, col) => col).filter(
    (col) => !pivotSet.has(col),
  );
  if (freeColumns.length === 0) {
    return { kind: "unique", solution: particular, ...base };
  }

  const basisValues = Array<Rational>(variableCount * freeColumns.length).fill(Rational.ZERO);
  freeColumns.forEach((freeCol, basisIndex) => {
    basisValues[freeCol * freeColumns.length + basisIndex] = Rational.ONE;
    result.pivotColumns.forEach((pivotCol, pivotRow) => {
      basisValues[pivotCol * freeColumns.length + basisIndex] = result.matrix
        .get(pivotRow, freeCol)
        .negate();
    });
  });

  return {
    kind: "infinite",
    particular,
    nullSpaceBasis: Matrix.fromFlat(variableCount, freeColumns.length, basisValues),
    freeColumns,
    ...base,
  };
}
