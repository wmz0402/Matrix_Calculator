import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  characteristicPolynomial,
  determinant,
  eliminate,
  inverse,
  multiply,
  plu,
} from "../src/algorithms";
import { Matrix, Rational } from "../src/core";

function squareMatrix(values: readonly number[], size: number): Matrix {
  return Matrix.fromFlat(
    size,
    size,
    values.map((value) => Rational.fromInteger(value)),
  );
}

describe("algebraic properties", () => {
  const matrix2 = fc.array(fc.integer({ min: -8, max: 8 }), { minLength: 4, maxLength: 4 });
  const matrix3 = fc.array(fc.integer({ min: -5, max: 5 }), { minLength: 9, maxLength: 9 });

  it("satisfies det(AB) = det(A)det(B)", () => {
    fc.assert(
      fc.property(matrix2, matrix2, (leftValues, rightValues) => {
        const left = squareMatrix(leftValues, 2);
        const right = squareMatrix(rightValues, 2);
        expect(determinant(multiply(left, right)).equals(determinant(left).multiply(determinant(right)))).toBe(
          true,
        );
      }),
      { numRuns: 200 },
    );
  });

  it("produces an idempotent RREF", () => {
    fc.assert(
      fc.property(matrix3, (values) => {
        const value = squareMatrix(values, 3);
        const once = eliminate(value, { form: "rref" }).matrix;
        const twice = eliminate(once, { form: "rref" }).matrix;
        expect(twice.equals(once)).toBe(true);
      }),
      { numRuns: 150 },
    );
  });

  it("verifies A inverse(A) = I whenever det(A) is nonzero", () => {
    fc.assert(
      fc.property(matrix3, (values) => {
        const value = squareMatrix(values, 3);
        fc.pre(!determinant(value).isZero());
        expect(multiply(value, inverse(value).inverse).equals(Matrix.identity(3))).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it("verifies P A = L U and the singular flag for random matrices", () => {
    fc.assert(
      fc.property(matrix3, (values) => {
        const value = squareMatrix(values, 3);
        const result = plu(value);
        expect(multiply(result.permutation, value).equals(multiply(result.lower, result.upper))).toBe(
          true,
        );
        expect(result.singular).toBe(determinant(value).isZero());
      }),
      { numRuns: 100 },
    );
  });

  it("matches the characteristic polynomial constant with the determinant", () => {
    fc.assert(
      fc.property(matrix3, (values) => {
        const value = squareMatrix(values, 3);
        const coefficients = characteristicPolynomial(value);
        const constant = coefficients.at(-1);
        expect(constant?.equals(determinant(value).negate())).toBe(true);
      }),
      { numRuns: 100 },
    );
  });
});
