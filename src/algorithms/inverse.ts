import { MatrixError, requireSquare } from "../core/errors";
import { Matrix } from "../core/matrix";
import { eliminate, type RowOperation } from "./elimination";

export interface InverseOptions {
  readonly trace?: boolean;
  readonly maxTraceSteps?: number;
}

export interface InverseResult {
  readonly inverse: Matrix;
  readonly augmentedRref: Matrix;
  readonly operations: readonly RowOperation[];
  readonly traceTruncated: boolean;
}

export function inverse(matrix: Matrix, options: InverseOptions = {}): InverseResult {
  requireSquare(matrix.rows, matrix.cols, "逆矩阵");
  const size = matrix.rows;
  const augmented = matrix.augment(Matrix.identity(size));
  const result = eliminate(augmented, {
    form: "rref",
    pivotColumnLimit: size,
    trace: options.trace,
    maxTraceSteps: options.maxTraceSteps,
  });
  if (result.rank !== size) {
    throw new MatrixError("SINGULAR_MATRIX", "矩阵不可逆", {
      rank: result.rank,
      size,
    });
  }
  return {
    inverse: result.matrix.sliceColumns(size),
    augmentedRref: result.matrix,
    operations: result.operations,
    traceTruncated: result.traceTruncated,
  };
}
