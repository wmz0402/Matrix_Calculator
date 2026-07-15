import { Matrix } from "../core/matrix";
import { Rational, rationalAbs } from "../core/rational";
import type { RowOperation } from "../algorithms/elimination";

export function rationalToLatex(value: Rational): string {
  if (value.denominator === 1n) return value.numerator.toString();
  const magnitude = `\\frac{${(value.numerator < 0n ? -value.numerator : value.numerator).toString()}}{${value.denominator.toString()}}`;
  return value.numerator < 0n ? `-${magnitude}` : magnitude;
}

export function matrixToLatex(matrix: Matrix): string {
  if (matrix.rows === 0 || matrix.cols === 0) return "\\begin{bmatrix}\\end{bmatrix}";
  const rows = matrix
    .toRows()
    .map((row) => row.map(rationalToLatex).join(" & "))
    .join(" \\\\ ");
  return `\\begin{bmatrix}${rows}\\end{bmatrix}`;
}

export function augmentedMatrixToLatex(matrix: Matrix, leftColumns: number): string {
  const rightColumns = matrix.cols - leftColumns;
  const specification = `${"c".repeat(leftColumns)}${rightColumns > 0 ? `|${"c".repeat(rightColumns)}` : ""}`;
  const rows = matrix
    .toRows()
    .map((row) => row.map(rationalToLatex).join(" & "))
    .join(" \\\\ ");
  return `\\left[\\begin{array}{${specification}}${rows}\\end{array}\\right]`;
}

export function rowOperationToLatex(operation: RowOperation): string {
  if (operation.type === "swap") {
    return `R_{${operation.first + 1}} \\leftrightarrow R_{${operation.second + 1}}`;
  }
  if (operation.type === "scale") {
    return `R_{${operation.row + 1}} \\leftarrow ${rationalToLatex(operation.factor)}R_{${operation.row + 1}}`;
  }

  const sign = operation.factor.numerator < 0n ? "-" : "+";
  const magnitude = rationalAbs(operation.factor);
  const coefficient = magnitude.isOne() ? "" : rationalToLatex(magnitude);
  return `R_{${operation.target + 1}} \\leftarrow R_{${operation.target + 1}} ${sign} ${coefficient}R_{${operation.source + 1}}`;
}

export function polynomialToLatex(
  coefficients: readonly Rational[],
  variable = "\\lambda",
): string {
  const degree = coefficients.length - 1;
  const terms: string[] = [];
  coefficients.forEach((coefficient, index) => {
    if (coefficient.isZero()) return;
    const exponent = degree - index;
    const negative = coefficient.numerator < 0n;
    const magnitude = rationalAbs(coefficient);
    const variablePart = exponent === 0 ? "" : exponent === 1 ? variable : `${variable}^{${exponent}}`;
    const coefficientPart = exponent > 0 && magnitude.isOne() ? "" : rationalToLatex(magnitude);
    const term = `${coefficientPart}${variablePart}`;
    if (terms.length === 0) terms.push(negative ? `-${term}` : term);
    else terms.push(`${negative ? "-" : "+"} ${term}`);
  });
  return terms.length === 0 ? "0" : terms.join(" ");
}
