export type MatrixErrorCode =
  | "EMPTY_MATRIX"
  | "INVALID_MATRIX_SHAPE"
  | "INVALID_NUMBER"
  | "ZERO_DENOMINATOR"
  | "DIMENSION_MISMATCH"
  | "NOT_SQUARE"
  | "SINGULAR_MATRIX"
  | "INVALID_EXPONENT"
  | "INDEX_OUT_OF_RANGE"
  | "RESOURCE_LIMIT";

export class MatrixError extends Error {
  readonly code: MatrixErrorCode;
  readonly details: Readonly<Record<string, unknown>>;

  constructor(
    code: MatrixErrorCode,
    message: string,
    details: Readonly<Record<string, unknown>> = {},
  ) {
    super(message);
    this.name = "MatrixError";
    this.code = code;
    this.details = details;
  }
}

export function dimensionMismatch(message: string, details: Readonly<Record<string, unknown>>): never {
  throw new MatrixError("DIMENSION_MISMATCH", message, details);
}

export function requireSquare(rows: number, cols: number, operation: string): void {
  if (rows !== cols) {
    throw new MatrixError("NOT_SQUARE", `${operation}只适用于方阵`, {
      operation,
      rows,
      cols,
    });
  }
}
