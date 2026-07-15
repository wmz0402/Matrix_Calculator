import { expect } from "vitest";
import { Matrix, parseMatrix } from "../src/core";

export function matrix(text: string): Matrix {
  return parseMatrix(text);
}

export function expectMatrix(actual: Matrix, expected: string): void {
  const target = matrix(expected);
  expect(actual.rows).toBe(target.rows);
  expect(actual.cols).toBe(target.cols);
  expect(actual.equals(target)).toBe(true);
}
