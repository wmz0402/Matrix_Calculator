import { describe, expect, it } from "vitest";
import {
  add,
  adjugate,
  characteristicPolynomial,
  columnSpace,
  determinant,
  eliminate,
  inverse,
  materializeTrace,
  multiply,
  nullSpace,
  plu,
  power,
  rowSpace,
  scale,
  solve,
  subtract,
  trace,
  transpose,
} from "../src/algorithms";
import { Matrix, Rational } from "../src/core";
import { expectMatrix, matrix } from "./helpers";

describe("basic operations", () => {
  it("adds, subtracts, multiplies, transposes and scales", () => {
    const left = matrix("1 2; 3 4");
    const right = matrix("5 6; 7 8");
    expectMatrix(add(left, right), "6 8; 10 12");
    expectMatrix(subtract(right, left), "4 4; 4 4");
    expectMatrix(multiply(left, right), "19 22; 43 50");
    expectMatrix(transpose(left), "1 3; 2 4");
    expectMatrix(scale(left, Rational.parse("1/2")), "1/2 1; 3/2 2");
    expect(trace(left).toString()).toBe("5");
  });

  it("computes positive, zero and negative powers", () => {
    const value = matrix("1 1; 0 1");
    expectMatrix(power(value, 5), "1 5; 0 1");
    expectMatrix(power(value, 0), "1 0; 0 1");
    expectMatrix(power(value, -2), "1 -2; 0 1");
  });
});

describe("elimination", () => {
  it("computes exact RREF and records replayable operations", () => {
    const input = matrix("1 2 1; 2 4 0; -1 -2 3");
    const result = eliminate(input, { form: "rref", trace: true });
    expectMatrix(result.matrix, "1 2 0; 0 0 1; 0 0 0");
    expect(result.pivotColumns).toEqual([0, 2]);
    const snapshots = materializeTrace(input, result.operations);
    expect(snapshots.at(-1)?.matrix.equals(result.matrix)).toBe(true);
  });

  it("can stop trace recording without stopping calculation", () => {
    const result = eliminate(matrix("1 2; 3 4"), {
      form: "rref",
      trace: true,
      maxTraceSteps: 1,
    });
    expectMatrix(result.matrix, "1 0; 0 1");
    expect(result.operations).toHaveLength(1);
    expect(result.traceTruncated).toBe(true);
  });
});

describe("determinant, inverse and adjugate", () => {
  it("computes exact determinant with Bareiss elimination", () => {
    expect(determinant(matrix("1 2 3; 0 4 5; 1 0 6")).toString()).toBe("22");
    expect(determinant(matrix("1/2 1/3; 2/5 3/7")).toString()).toBe("17/210");
  });

  it("computes inverse and verifies the identity", () => {
    const value = matrix("1 2; 3 4");
    const result = inverse(value, { trace: true });
    expectMatrix(result.inverse, "-2 1; 3/2 -1/2");
    expect(multiply(value, result.inverse).equals(Matrix.identity(2))).toBe(true);
    expect(result.operations.length).toBeGreaterThan(0);
  });

  it("computes adjugates for singular matrices", () => {
    const value = matrix("1 2; 2 4");
    expectMatrix(adjugate(value), "4 -2; -2 1");
    expectMatrix(multiply(value, adjugate(value)), "0 0; 0 0");
    expectMatrix(adjugate(matrix("0")), "1");
  });

  it("returns zero adjugate when rank is below n - 1", () => {
    expectMatrix(adjugate(matrix("1 0 0; 0 0 0; 0 0 0")), "0 0 0; 0 0 0; 0 0 0");
  });
});

describe("linear systems", () => {
  it("returns the correct number of variables for a consistent overdetermined system", () => {
    const result = solve(matrix("1 0; 0 1; 0 0"), matrix("2; 3; 0"));
    expect(result.kind).toBe("unique");
    if (result.kind !== "unique") return;
    expectMatrix(result.solution, "2; 3");
  });

  it("returns a particular solution and null-space basis", () => {
    const left = matrix("1 2 3; 2 4 6");
    const right = matrix("4; 8");
    const result = solve(left, right);
    expect(result.kind).toBe("infinite");
    if (result.kind !== "infinite") return;
    expect(multiply(left, result.particular).equals(right)).toBe(true);
    expect(multiply(left, result.nullSpaceBasis).equals(Matrix.zeros(2, 2))).toBe(true);
    expect(result.freeColumns).toEqual([1, 2]);
  });

  it("identifies individual inconsistent right-hand sides", () => {
    const result = solve(matrix("1 1; 2 2"), matrix("2 2; 4 5"));
    expect(result.kind).toBe("inconsistent");
    if (result.kind !== "inconsistent") return;
    expect(result.inconsistentRightHandSides).toEqual([1]);
  });
});

describe("subspaces and decompositions", () => {
  it("computes null, column and row space bases", () => {
    const value = matrix("1 2 3; 2 4 6");
    const nullResult = nullSpace(value);
    expect(nullResult.dimension).toBe(2);
    expect(multiply(value, nullResult.basis).equals(Matrix.zeros(2, 2))).toBe(true);

    const columnResult = columnSpace(value);
    expect(columnResult.dimension).toBe(1);
    expectMatrix(columnResult.basis, "1; 2");

    const rowResult = rowSpace(value);
    expect(rowResult.dimension).toBe(1);
    expectMatrix(rowResult.basis, "1 2 3");
  });

  it("represents a trivial null space as an n by 0 matrix", () => {
    const result = nullSpace(Matrix.identity(3));
    expect(result.dimension).toBe(0);
    expect(result.basis.rows).toBe(3);
    expect(result.basis.cols).toBe(0);
  });

  it("computes a PLU decomposition with row swaps", () => {
    const value = matrix("0 2 1; 1 1 0; 2 1 1");
    const result = plu(value);
    expect(multiply(result.permutation, value).equals(multiply(result.lower, result.upper))).toBe(
      true,
    );
    expect(result.singular).toBe(false);
  });
});

describe("characteristic polynomial", () => {
  it("returns coefficients of det(lambda I - A)", () => {
    const coefficients = characteristicPolynomial(matrix("1 2; 3 4"));
    expect(coefficients.map(String)).toEqual(["1", "-5", "-2"]);
  });

  it("handles a 3 by 3 matrix", () => {
    const coefficients = characteristicPolynomial(matrix("1 0 0; 0 2 0; 0 0 3"));
    expect(coefficients.map(String)).toEqual(["1", "-6", "11", "-6"]);
  });
});
