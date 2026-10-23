const zero = BigInt(0);
const one = BigInt(1);
const absolute = (n: bigint) => (n < zero ? -n : n);

export class Rational {
  private constructor(
    readonly numerator: bigint,
    readonly denominator: bigint,
  ) {}

  static of(n: bigint, d = one): Rational {
    if (d === zero) throw new Error("A rational denominator cannot be zero.");
    if (d < zero) {
      n = -n;
      d = -d;
    }
    let a = absolute(n),
      b = d;
    while (b !== zero) [a, b] = [b, a % b];
    return new Rational(n / a, d / a);
  }

  static integer(n: number): Rational {
    return Rational.of(BigInt(n));
  }
  add(b: Rational): Rational {
    return Rational.of(
      this.numerator * b.denominator + b.numerator * this.denominator,
      this.denominator * b.denominator,
    );
  }
  subtract(b: Rational): Rational {
    return this.add(Rational.of(-b.numerator, b.denominator));
  }
  multiply(b: Rational): Rational {
    return Rational.of(
      this.numerator * b.numerator,
      this.denominator * b.denominator,
    );
  }
  divide(b: Rational): Rational {
    return Rational.of(
      this.numerator * b.denominator,
      this.denominator * b.numerator,
    );
  }
  compare(b: Rational): -1 | 0 | 1 {
    const n = this.numerator * b.denominator - b.numerator * this.denominator;
    return n < zero ? -1 : n > zero ? 1 : 0;
  }
  absolute(): Rational {
    return Rational.of(absolute(this.numerator), this.denominator);
  }
  text(): string {
    return this.denominator === one
      ? String(this.numerator)
      : `${this.numerator}/${this.denominator}`;
  }
}

export function parseRational(
  raw: string,
): { kind: "valid"; value: Rational } | { kind: "invalid"; message: string } {
  const text = raw.trim();
  if (text.length > 32 || !/^[+-]?\d+(?:\.\d+|\/[+-]?\d+)?$/.test(text))
    return {
      kind: "invalid",
      message:
        "Use an integer, finite decimal, or fraction, at most 32 characters. Expressions and exponents are not accepted.",
    };
  let n: bigint,
    d = one;
  if (text.includes("/")) {
    const [numerator, denominator] = text.split("/");
    n = BigInt(numerator);
    d = BigInt(denominator);
    if (d === zero)
      return { kind: "invalid", message: "A denominator cannot be zero." };
  } else if (text.includes(".")) {
    const [whole, fraction] = text.replace(/^[+-]/, "").split(".");
    n = BigInt(whole + fraction) * BigInt(text.startsWith("-") ? -1 : 1);
    d = BigInt(10) ** BigInt(fraction.length);
  } else n = BigInt(text);
  const value = Rational.of(n, d);
  if (value.absolute().compare(Rational.integer(1_000_000)) > 0)
    return {
      kind: "invalid",
      message: "Use a rational with magnitude at most 1,000,000.",
    };
  return { kind: "valid", value };
}
