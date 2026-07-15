import { dimensionMismatch, MatrixError } from "./errors";
import { Rational } from "./rational";

export const MAX_MATRIX_CELLS = 1_000_000;

function validateShape(rows: number, cols: number): number {
  if (!Number.isSafeInteger(rows) || !Number.isSafeInteger(cols) || rows < 0 || cols < 0) {
    throw new MatrixError("INVALID_MATRIX_SHAPE", "矩阵尺寸必须是非负安全整数", {
      rows,
      cols,
    });
  }
  const cells = rows * cols;
  if (!Number.isSafeInteger(cells) || cells > MAX_MATRIX_CELLS) {
    throw new MatrixError("RESOURCE_LIMIT", `矩阵元素数量不能超过 ${MAX_MATRIX_CELLS}`, {
      rows,
      cols,
      cells,
      limit: MAX_MATRIX_CELLS,
    });
  }
  return cells;
}

export class Matrix {
  readonly rows: number;
  readonly cols: number;
  readonly #values: readonly Rational[];

  private constructor(rows: number, cols: number, values: readonly Rational[]) {
    this.rows = rows;
    this.cols = cols;
    this.#values = Object.freeze([...values]);
  }

  static fromRows(rows: readonly (readonly Rational[])[]): Matrix {
    if (rows.length === 0) {
      throw new MatrixError("EMPTY_MATRIX", "矩阵不能为空");
    }
    const firstRow = rows[0];
    if (firstRow === undefined || firstRow.length === 0) {
      throw new MatrixError("EMPTY_MATRIX", "矩阵至少需要一列");
    }
    const cols = firstRow.length;
    validateShape(rows.length, cols);
    const values: Rational[] = [];
    rows.forEach((row, index) => {
      if (row.length !== cols) {
        throw new MatrixError("INVALID_MATRIX_SHAPE", "矩阵每行的列数必须一致", {
          row: index + 1,
          expected: cols,
          actual: row.length,
        });
      }
      values.push(...row);
    });
    return new Matrix(rows.length, cols, values);
  }

  static fromFlat(rows: number, cols: number, values: readonly Rational[]): Matrix {
    const cells = validateShape(rows, cols);
    if (values.length !== cells) {
      throw new MatrixError("INVALID_MATRIX_SHAPE", "矩阵元素数量与尺寸不匹配", {
        rows,
        cols,
        values: values.length,
      });
    }
    return new Matrix(rows, cols, values);
  }

  static zeros(rows: number, cols: number): Matrix {
    const cells = validateShape(rows, cols);
    return Matrix.fromFlat(rows, cols, Array<Rational>(cells).fill(Rational.ZERO));
  }

  static identity(size: number): Matrix {
    if (!Number.isSafeInteger(size) || size < 0) {
      throw new MatrixError("INVALID_MATRIX_SHAPE", "单位矩阵阶数必须是非负安全整数", {
        size,
      });
    }
    validateShape(size, size);
    const values = Array<Rational>(size * size).fill(Rational.ZERO);
    for (let index = 0; index < size; index += 1) {
      values[index * size + index] = Rational.ONE;
    }
    return Matrix.fromFlat(size, size, values);
  }

  get(row: number, col: number): Rational {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
      throw new MatrixError("INDEX_OUT_OF_RANGE", "矩阵索引越界", {
        row,
        col,
        rows: this.rows,
        cols: this.cols,
      });
    }
    const value = this.#values[row * this.cols + col];
    if (value === undefined) {
      throw new MatrixError("INDEX_OUT_OF_RANGE", "矩阵索引越界", { row, col });
    }
    return value;
  }

  toRows(): Rational[][] {
    return Array.from({ length: this.rows }, (_, row) =>
      Array.from({ length: this.cols }, (_, col) => this.get(row, col)),
    );
  }

  toFlatArray(): Rational[] {
    return [...this.#values];
  }

  map(mapper: (value: Rational, row: number, col: number) => Rational): Matrix {
    const values = this.#values.map((value, index) => {
      const row = Math.floor(index / this.cols);
      const col = index % this.cols;
      return mapper(value, row, col);
    });
    return Matrix.fromFlat(this.rows, this.cols, values);
  }

  augment(other: Matrix): Matrix {
    if (this.rows !== other.rows) {
      dimensionMismatch("增广矩阵的行数必须一致", {
        leftRows: this.rows,
        rightRows: other.rows,
      });
    }
    const values: Rational[] = [];
    for (let row = 0; row < this.rows; row += 1) {
      for (let col = 0; col < this.cols; col += 1) values.push(this.get(row, col));
      for (let col = 0; col < other.cols; col += 1) values.push(other.get(row, col));
    }
    return Matrix.fromFlat(this.rows, this.cols + other.cols, values);
  }

  sliceColumns(start: number, end: number = this.cols): Matrix {
    if (start < 0 || end < start || end > this.cols) {
      throw new MatrixError("INDEX_OUT_OF_RANGE", "列切片范围无效", {
        start,
        end,
        cols: this.cols,
      });
    }
    const width = end - start;
    const values: Rational[] = [];
    for (let row = 0; row < this.rows; row += 1) {
      for (let col = start; col < end; col += 1) values.push(this.get(row, col));
    }
    return Matrix.fromFlat(this.rows, width, values);
  }

  selectColumns(indices: readonly number[]): Matrix {
    const values: Rational[] = [];
    for (let row = 0; row < this.rows; row += 1) {
      for (const col of indices) values.push(this.get(row, col));
    }
    return Matrix.fromFlat(this.rows, indices.length, values);
  }

  selectRows(indices: readonly number[]): Matrix {
    const values: Rational[] = [];
    for (const row of indices) {
      for (let col = 0; col < this.cols; col += 1) values.push(this.get(row, col));
    }
    return Matrix.fromFlat(indices.length, this.cols, values);
  }

  equals(other: Matrix): boolean {
    if (this.rows !== other.rows || this.cols !== other.cols) return false;
    return this.#values.every((value, index) => {
      const otherValue = other.#values[index];
      return otherValue !== undefined && value.equals(otherValue);
    });
  }
}
