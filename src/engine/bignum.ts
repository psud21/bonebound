import Decimal from 'break_eternity.js';

export { Decimal };
export type DecimalSource = Decimal | number | string;

/** Shorthand constructor: D(10), D('1e300'), D(existingDecimal). */
export function D(value: DecimalSource): Decimal {
  return value instanceof Decimal ? value : new Decimal(value);
}

export const ZERO = new Decimal(0);
export const ONE = new Decimal(1);

export function isDecimal(value: unknown): value is Decimal {
  return value instanceof Decimal;
}
