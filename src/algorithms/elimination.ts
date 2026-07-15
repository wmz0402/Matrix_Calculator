import { MatrixError } from "../core/errors";
import { Matrix } from "../core/matrix";
import { Rational } from "../core/rational";

export type RowOperation =
  | { readonly type: "swap"; readonly first: number; readonly second: number }
  | { readonly type: "scale"; readonly row: number; readonly factor: Rational }
  | {
      readonly type: "addMultiple";
      readonly target: number;
      readonly source: number;
      readonly factor: Rational;
    };

export interface EliminationOptions {
  readonly form?: "ref" | "rref";
  readonly pivotColumnLimit?: number;
  readonly trace?: boolean;
  readonly maxTraceSteps?: number;
}

export interface EliminationResult {
  readonly matrix: Matrix;
  readonly pivotColumns: readonly number[];
  readonly rank: number;
  readonly operations: readonly RowOperation[];
  readonly traceTruncated: boolean;
}

function rowsToMatrix(rows: readonly (readonly Rational[])[], cols: number): Matrix {
  return Matrix.fromFlat(rows.length, cols, rows.flat());
}

function applyOperationToRows(rows: Rational[][], operation: RowOperation): void {
  if (operation.type === "swap") {
    [rows[operation.first], rows[operation.second]] = [
      rows[operation.second]!,
      rows[operation.first]!,
    ];
    return;
  }

  if (operation.type === "scale") {
    rows[operation.row] = rows[operation.row]!.map((value) =>
      value.multiply(operation.factor),
    );
    return;
  }

  const source = rows[operation.source]!;
  rows[operation.target] = rows[operation.target]!.map((value, col) =>
    value.add(operation.factor.multiply(source[col]!)),
  );
}

export function applyRowOperation(matrix: Matrix, operation: RowOperation): Matrix {
  const rows = matrix.toRows();
  applyOperationToRows(rows, operation);
  return rowsToMatrix(rows, matrix.cols);
}

export function materializeTrace(
  initial: Matrix,
  operations: readonly RowOperation[],
): readonly { readonly operation: RowOperation; readonly matrix: Matrix }[] {
  const rows = initial.toRows();
  return operations.map((operation) => {
    applyOperationToRows(rows, operation);
    return { operation, matrix: rowsToMatrix(rows, initial.cols) };
  });
}

export function eliminate(matrix: Matrix, options: EliminationOptions = {}): EliminationResult {
  const form = options.form ?? "rref";
  const pivotColumnLimit = options.pivotColumnLimit ?? matrix.cols;
  const maxTraceSteps = options.maxTraceSteps ?? 10_000;
  if (
    !Number.isSafeInteger(pivotColumnLimit) ||
    pivotColumnLimit < 0 ||
    pivotColumnLimit > matrix.cols
  ) {
    throw new MatrixError("INVALID_MATRIX_SHAPE", "主元列范围无效", {
      pivotColumnLimit,
      cols: matrix.cols,
    });
  }
  if (!Number.isSafeInteger(maxTraceSteps) || maxTraceSteps < 0) {
    throw new MatrixError("RESOURCE_LIMIT", "步骤数量上限无效", { maxTraceSteps });
  }

  const rows = matrix.toRows();
  const pivotColumns: number[] = [];
  const operations: RowOperation[] = [];
  let traceTruncated = false;

  const record = (operation: RowOperation): void => {
    if (!options.trace) return;
    if (operations.length < maxTraceSteps) operations.push(operation);
    else traceTruncated = true;
  };

  let pivotRow = 0;
  for (let pivotCol = 0; pivotCol < pivotColumnLimit && pivotRow < matrix.rows; pivotCol += 1) {
    let candidate = pivotRow;
    while (candidate < matrix.rows && rows[candidate]![pivotCol]!.isZero()) candidate += 1;
    if (candidate === matrix.rows) continue;

    if (candidate !== pivotRow) {
      const operation: RowOperation = { type: "swap", first: pivotRow, second: candidate };
      applyOperationToRows(rows, operation);
      record(operation);
    }

    const pivot = rows[pivotRow]![pivotCol]!;
    if (form === "rref" && !pivot.isOne()) {
      const operation: RowOperation = {
        type: "scale",
        row: pivotRow,
        factor: pivot.reciprocal(),
      };
      applyOperationToRows(rows, operation);
      record(operation);
    }

    const firstTarget = form === "rref" ? 0 : pivotRow + 1;
    for (let target = firstTarget; target < matrix.rows; target += 1) {
      if (target === pivotRow) continue;
      const entry = rows[target]![pivotCol]!;
      if (entry.isZero()) continue;
      const currentPivot = rows[pivotRow]![pivotCol]!;
      const operation: RowOperation = {
        type: "addMultiple",
        target,
        source: pivotRow,
        factor: entry.divide(currentPivot).negate(),
      };
      applyOperationToRows(rows, operation);
      record(operation);
    }

    pivotColumns.push(pivotCol);
    pivotRow += 1;
  }

  return {
    matrix: rowsToMatrix(rows, matrix.cols),
    pivotColumns,
    rank: pivotColumns.length,
    operations,
    traceTruncated,
  };
}
