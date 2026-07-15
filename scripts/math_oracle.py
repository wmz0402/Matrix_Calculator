"""Small standard-library oracle used to cross-check the TypeScript exact core."""

from fractions import Fraction
from itertools import permutations
import json
import sys


def determinant(rows: list[list[Fraction]]) -> Fraction:
    size = len(rows)
    if size == 0:
        return Fraction(1)
    if size == 1:
        return rows[0][0]
    total = Fraction(0)
    for col, value in enumerate(rows[0]):
        minor = [row[:col] + row[col + 1 :] for row in rows[1:]]
        total += (-1 if col % 2 else 1) * value * determinant(minor)
    return total


def rref(rows: list[list[Fraction]], pivot_limit: int | None = None):
    work = [row[:] for row in rows]
    row_count = len(work)
    col_count = len(work[0]) if row_count else 0
    limit = col_count if pivot_limit is None else pivot_limit
    pivot_row = 0
    pivot_cols: list[int] = []
    for pivot_col in range(limit):
        candidate = next(
            (row for row in range(pivot_row, row_count) if work[row][pivot_col] != 0),
            None,
        )
        if candidate is None:
            continue
        work[pivot_row], work[candidate] = work[candidate], work[pivot_row]
        pivot = work[pivot_row][pivot_col]
        work[pivot_row] = [value / pivot for value in work[pivot_row]]
        for row in range(row_count):
            if row == pivot_row:
                continue
            factor = work[row][pivot_col]
            if factor:
                work[row] = [
                    value - factor * pivot_value
                    for value, pivot_value in zip(work[row], work[pivot_row])
                ]
        pivot_cols.append(pivot_col)
        pivot_row += 1
        if pivot_row == row_count:
            break
    return work, pivot_cols


def polynomial_add(left: list[Fraction], right: list[Fraction]):
    size = max(len(left), len(right))
    result = [Fraction(0)] * size
    for index in range(size):
        result[index] = (left[index] if index < len(left) else 0) + (
            right[index] if index < len(right) else 0
        )
    return result


def polynomial_multiply(left: list[Fraction], right: list[Fraction]):
    result = [Fraction(0)] * (len(left) + len(right) - 1)
    for left_index, left_value in enumerate(left):
        for right_index, right_value in enumerate(right):
            result[left_index + right_index] += left_value * right_value
    return result


def characteristic_polynomial(rows: list[list[Fraction]]):
    size = len(rows)
    result = [Fraction(0)] * (size + 1)
    for permutation in permutations(range(size)):
        inversions = sum(
            permutation[left] > permutation[right]
            for left in range(size)
            for right in range(left + 1, size)
        )
        term = [Fraction(-1 if inversions % 2 else 1)]
        for row, col in enumerate(permutation):
            factor = [-rows[row][col], Fraction(1)] if row == col else [-rows[row][col]]
            term = polynomial_multiply(term, factor)
        result = polynomial_add(result, term)
    return list(reversed(result))


def serialize(value: Fraction) -> str:
    return str(value.numerator) if value.denominator == 1 else f"{value.numerator}/{value.denominator}"


def analyze(case):
    rows = [[Fraction(value) for value in row] for row in case["matrix"]]
    reduced, pivots = rref(rows)
    det = determinant(rows)
    size = len(rows)
    inverse = None
    if det:
        augmented = [
            row + [Fraction(int(row_index == col)) for col in range(size)]
            for row_index, row in enumerate(rows)
        ]
        inverse = [row[size:] for row in rref(augmented, size)[0]]
    return {
        "determinant": serialize(det),
        "rref": [[serialize(value) for value in row] for row in reduced],
        "rank": len(pivots),
        "inverse": None
        if inverse is None
        else [[serialize(value) for value in row] for row in inverse],
        "characteristicPolynomial": [serialize(value) for value in characteristic_polynomial(rows)],
    }


def main():
    cases = json.load(sys.stdin)
    json.dump([analyze(case) for case in cases], sys.stdout, separators=(",", ":"))


if __name__ == "__main__":
    main()
