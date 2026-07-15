import { MatrixError } from "./errors";
import { Matrix } from "./matrix";
import { Rational } from "./rational";

export interface ParseLimits {
  readonly maxRows: number;
  readonly maxCols: number;
  readonly maxTokenLength: number;
}

export const DEFAULT_PARSE_LIMITS: ParseLimits = {
  maxRows: 100,
  maxCols: 100,
  maxTokenLength: 1_000,
};

export function parseMatrix(
  text: string,
  limits: ParseLimits = DEFAULT_PARSE_LIMITS,
): Matrix {
  if (text.trim().length === 0) {
    throw new MatrixError("EMPTY_MATRIX", "矩阵不能为空");
  }

  const lines = text
    .replace(/\r\n?/g, "\n")
    .split(/[\n;]/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length > limits.maxRows) {
    throw new MatrixError("RESOURCE_LIMIT", `矩阵行数不能超过 ${limits.maxRows}`, {
      rows: lines.length,
      limit: limits.maxRows,
    });
  }

  const rows = lines.map((line, rowIndex) => {
    if (/^,|,$|,\s*,/.test(line)) {
      throw new MatrixError("INVALID_NUMBER", `第 ${rowIndex + 1} 行存在空元素`, {
        row: rowIndex + 1,
      });
    }
    const tokens = line.split(/[\s,]+/);
    if (tokens.length > limits.maxCols) {
      throw new MatrixError("RESOURCE_LIMIT", `矩阵列数不能超过 ${limits.maxCols}`, {
        row: rowIndex + 1,
        cols: tokens.length,
        limit: limits.maxCols,
      });
    }
    return tokens.map((token, colIndex) => {
      if (token.length > limits.maxTokenLength) {
        throw new MatrixError("RESOURCE_LIMIT", "单个数字过长", {
          row: rowIndex + 1,
          col: colIndex + 1,
          length: token.length,
          limit: limits.maxTokenLength,
        });
      }
      try {
        return Rational.parse(token);
      } catch (error) {
        if (error instanceof MatrixError) {
          throw new MatrixError(error.code, `第 ${rowIndex + 1} 行第 ${colIndex + 1} 列：${error.message}`, {
            ...error.details,
            row: rowIndex + 1,
            col: colIndex + 1,
          });
        }
        throw error;
      }
    });
  });

  return Matrix.fromRows(rows);
}
