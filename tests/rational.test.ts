import { describe, expect, it } from "vitest";
import { MatrixError, Rational } from "../src/core";

describe("Rational", () => {
  it("normalizes signs and common divisors", () => {
    expect(new Rational(6n, -8n).toString()).toBe("-3/4");
    expect(new Rational(0n, -99n).equals(Rational.ZERO)).toBe(true);
  });

  it.each([
    ["3/4", "3/4"],
    ["-10/20", "-1/2"],
    ["0.125", "1/8"],
    ["-.5", "-1/2"],
    ["12.", "12"],
    ["+42", "42"],
  ])("parses %s exactly", (input, expected) => {
    expect(Rational.parse(input).toString()).toBe(expected);
  });

  it.each(["", "1/2/3", "1e3", "NaN", ".", "1.2.3"])(
    "rejects malformed value %s",
    (input) => {
      expect(() => Rational.parse(input)).toThrow(MatrixError);
    },
  );

  it("rejects zero denominators", () => {
    expect(() => Rational.parse("1/0")).toThrowError(
      expect.objectContaining({ code: "ZERO_DENOMINATOR" }),
    );
  });

  it("performs exact arithmetic", () => {
    const left = Rational.parse("12345678901234567890/7777777777777777777");
    const right = Rational.parse("7777777777777777777/12345678901234567890");
    expect(left.multiply(right).equals(Rational.ONE)).toBe(true);
    expect(Rational.parse("1/6").add(Rational.parse("1/15")).toString()).toBe("7/30");
    expect(Rational.parse("2/3").divide(Rational.parse("-4/5")).toString()).toBe("-5/6");
  });
});
