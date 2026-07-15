import { spawnSync } from "node:child_process";
import {
  characteristicPolynomial,
  determinant,
  eliminate,
  inverse,
} from "../src/algorithms";
import { Matrix, Rational } from "../src/core";

interface OracleResult {
  readonly determinant: string;
  readonly rref: readonly (readonly string[])[];
  readonly rank: number;
  readonly inverse: readonly (readonly string[])[] | null;
  readonly characteristicPolynomial: readonly string[];
}

let seed = 0x5eeda11;
function randomInteger(min: number, max: number): number {
  seed = (1664525 * seed + 1013904223) >>> 0;
  return min + (seed % (max - min + 1));
}

const cases = Array.from({ length: 240 }, (_, index) => {
  const size = (index % 4) + 1;
  return {
    matrix: Array.from({ length: size }, () =>
      Array.from({ length: size }, () => randomInteger(-7, 7)),
    ),
  };
});

const pythonCandidates: readonly (readonly [string, readonly string[]])[] =
  process.platform === "win32"
    ? [["py", ["-3"]], ["python", []]]
    : [["python3", []], ["python", []]];
let pythonOutput: string | undefined;
let pythonFailure = "未找到可用的 Python 3";
for (const [command, prefixArguments] of pythonCandidates) {
  const attempt = spawnSync(command, [...prefixArguments, "scripts/math_oracle.py"], {
    cwd: process.cwd(),
    input: JSON.stringify(cases),
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  });
  if (!attempt.error && attempt.status === 0) {
    pythonOutput = attempt.stdout;
    break;
  }
  pythonFailure = String(attempt.stderr || attempt.stdout || attempt.error);
}
if (pythonOutput === undefined) throw new Error(`Python oracle failed:\n${pythonFailure}`);
const oracleResults = JSON.parse(pythonOutput) as readonly OracleResult[];

function fromRows(rows: readonly (readonly number[])[]): Matrix {
  return Matrix.fromRows(rows.map((row) => row.map((value) => Rational.fromInteger(value))));
}

function serializeMatrix(matrix: Matrix): string[][] {
  return matrix.toRows().map((row) => row.map(String));
}

function assertEqual(actual: unknown, expected: unknown, label: string, index: number): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `Cross-check failed for case ${index}, ${label}:\nactual=${JSON.stringify(actual)}\nexpected=${JSON.stringify(expected)}`,
    );
  }
}

cases.forEach((testCase, index) => {
  const value = fromRows(testCase.matrix);
  const oracle = oracleResults[index];
  if (oracle === undefined) throw new Error(`Python oracle omitted case ${index}`);

  assertEqual(determinant(value).toString(), oracle.determinant, "determinant", index);
  const reduced = eliminate(value, { form: "rref" });
  assertEqual(serializeMatrix(reduced.matrix), oracle.rref, "RREF", index);
  assertEqual(reduced.rank, oracle.rank, "rank", index);
  assertEqual(
    characteristicPolynomial(value).map(String),
    oracle.characteristicPolynomial,
    "characteristic polynomial",
    index,
  );
  if (oracle.inverse !== null) {
    assertEqual(serializeMatrix(inverse(value).inverse), oracle.inverse, "inverse", index);
  }
});

console.log(`Cross-check passed: ${cases.length} matrices matched the independent Python oracle.`);
