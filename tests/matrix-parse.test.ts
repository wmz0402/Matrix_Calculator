import { describe, expect, it } from "vitest";
import { Matrix, MatrixError, parseMatrix, Rational } from "../src/core";

describe("Matrix and parser", () => {
  it("parses mixed row and column separators", () => {
    const value = parseMatrix("1, 2; 3/2 -0.25");
    expect(value.rows).toBe(2);
    expect(value.cols).toBe(2);
    expect(value.get(1, 0).toString()).toBe("3/2");
    expect(value.get(1, 1).toString()).toBe("-1/4");
  });

  it("reports the location of an invalid token", () => {
    expect(() => parseMatrix("1 2\n3 nope")).toThrowError(
      expect.objectContaining({
        code: "INVALID_NUMBER",
        message: expect.stringContaining("第 2 行第 2 列"),
      }),
    );
  });

  it.each(["1,,2", ",1 2", "1 2,"])("rejects an empty comma element in %s", (text) => {
    expect(() => parseMatrix(text)).toThrow(MatrixError);
  });

  it("rejects ragged rows", () => {
    expect(() => parseMatrix("1 2\n3")).toThrowError(
      expect.objectContaining({ code: "INVALID_MATRIX_SHAPE" }),
    );
  });

  it("enforces configurable input limits", () => {
    expect(() =>
      parseMatrix("1 2 3", { maxRows: 2, maxCols: 2, maxTokenLength: 10 }),
    ).toThrowError(expect.objectContaining({ code: "RESOURCE_LIMIT" }));
  });

  it("copies input rows and keeps matrix values immutable", () => {
    const rows = [[Rational.ONE, Rational.ZERO]];
    const value = Matrix.fromRows(rows);
    rows[0]![0] = Rational.ZERO;
    expect(value.get(0, 0)).toBe(Rational.ONE);
  });

  it("supports internal zero-width matrices for empty bases", () => {
    const value = Matrix.zeros(3, 0);
    expect(value.rows).toBe(3);
    expect(value.cols).toBe(0);
    expect(value.toFlatArray()).toEqual([]);
  });

  it("rejects matrices that exceed the core cell limit before allocation", () => {
    expect(() => Matrix.zeros(1_001, 1_000)).toThrowError(
      expect.objectContaining({ code: "RESOURCE_LIMIT" }),
    );
  });
});
