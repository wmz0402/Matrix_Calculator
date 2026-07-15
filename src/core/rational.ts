import { MatrixError } from "./errors";

function abs(value: bigint): bigint {
  return value < 0n ? -value : value;
}

function gcd(left: bigint, right: bigint): bigint {
  let a = abs(left);
  let b = abs(right);
  while (b !== 0n) {
    [a, b] = [b, a % b];
  }
  return a;
}

const INTEGER_PATTERN = /^[+-]?\d+$/;
const DECIMAL_PATTERN = /^[+-]?(?:\d+\.\d*|\.\d+)$/;
const FRACTION_PATTERN = /^([+-]?\d+)\/([+-]?\d+)$/;

export class Rational {
  static readonly ZERO = new Rational(0n);
  static readonly ONE = new Rational(1n);
  static readonly NEGATIVE_ONE = new Rational(-1n);

  readonly numerator: bigint;
  readonly denominator: bigint;

  constructor(numerator: bigint, denominator: bigint = 1n) {
    if (denominator === 0n) {
      throw new MatrixError("ZERO_DENOMINATOR", "分母不能为 0");
    }

    let normalizedNumerator = numerator;
    let normalizedDenominator = denominator;
    if (normalizedDenominator < 0n) {
      normalizedNumerator = -normalizedNumerator;
      normalizedDenominator = -normalizedDenominator;
    }

    const divisor = gcd(normalizedNumerator, normalizedDenominator);
    this.numerator = normalizedNumerator / divisor;
    this.denominator = normalizedDenominator / divisor;
  }

  static fromInteger(value: number | bigint): Rational {
    if (typeof value === "number" && !Number.isSafeInteger(value)) {
      throw new MatrixError("INVALID_NUMBER", `不是安全整数：${value}`);
    }
    return new Rational(BigInt(value));
  }

  static parse(raw: string): Rational {
    const value = raw.trim();
    if (value.length === 0) {
      throw new MatrixError("INVALID_NUMBER", "数字不能为空", { raw });
    }

    const fractionMatch = FRACTION_PATTERN.exec(value);
    if (fractionMatch) {
      const numeratorText = fractionMatch[1];
      const denominatorText = fractionMatch[2];
      if (numeratorText === undefined || denominatorText === undefined) {
        throw new MatrixError("INVALID_NUMBER", `非法分数：${value}`, { raw });
      }
      return new Rational(BigInt(numeratorText), BigInt(denominatorText));
    }

    if (INTEGER_PATTERN.test(value)) {
      return new Rational(BigInt(value));
    }

    if (DECIMAL_PATTERN.test(value)) {
      const negative = value.startsWith("-");
      const unsigned = value.startsWith("-") || value.startsWith("+") ? value.slice(1) : value;
      const [whole = "0", fraction = ""] = unsigned.split(".");
      const integerPart = whole.length === 0 ? "0" : whole;
      const scale = 10n ** BigInt(fraction.length);
      const magnitude = BigInt(`${integerPart}${fraction}`);
      return new Rational(negative ? -magnitude : magnitude, scale);
    }

    throw new MatrixError("INVALID_NUMBER", `非法数字：${value}`, { raw });
  }

  isZero(): boolean {
    return this.numerator === 0n;
  }

  isOne(): boolean {
    return this.numerator === 1n && this.denominator === 1n;
  }

  equals(other: Rational): boolean {
    return this.numerator === other.numerator && this.denominator === other.denominator;
  }

  negate(): Rational {
    return this.isZero() ? Rational.ZERO : new Rational(-this.numerator, this.denominator);
  }

  reciprocal(): Rational {
    if (this.isZero()) {
      throw new MatrixError("ZERO_DENOMINATOR", "不能对 0 取倒数");
    }
    return new Rational(this.denominator, this.numerator);
  }

  add(other: Rational): Rational {
    if (this.isZero()) return other;
    if (other.isZero()) return this;

    const common = gcd(this.denominator, other.denominator);
    const leftScale = other.denominator / common;
    const rightScale = this.denominator / common;
    return new Rational(
      this.numerator * leftScale + other.numerator * rightScale,
      this.denominator * leftScale,
    );
  }

  subtract(other: Rational): Rational {
    return this.add(other.negate());
  }

  multiply(other: Rational): Rational {
    if (this.isZero() || other.isZero()) return Rational.ZERO;

    const leftCancellation = gcd(this.numerator, other.denominator);
    const rightCancellation = gcd(other.numerator, this.denominator);
    return new Rational(
      (this.numerator / leftCancellation) * (other.numerator / rightCancellation),
      (this.denominator / rightCancellation) * (other.denominator / leftCancellation),
    );
  }

  divide(other: Rational): Rational {
    if (other.isZero()) {
      throw new MatrixError("ZERO_DENOMINATOR", "除数不能为 0");
    }
    return this.multiply(other.reciprocal());
  }

  toString(): string {
    if (this.denominator === 1n) return this.numerator.toString();
    return `${this.numerator}/${this.denominator}`;
  }
}

export function rationalAbs(value: Rational): Rational {
  return value.numerator < 0n ? value.negate() : value;
}
