import { D, Decimal, type DecimalSource } from './bignum';

/** Price of the next unit when `owned` are already owned: base × r^owned. */
export function costOf(base: DecimalSource, growth: number, owned: number): Decimal {
  return D(base).mul(Decimal.pow(growth, owned));
}

/** Total price of buying `count` more units: base × r^owned × (r^count − 1)/(r − 1). */
export function bulkCost(base: DecimalSource, growth: number, owned: number, count: number): Decimal {
  if (count <= 0) return new Decimal(0);
  if (growth === 1) return D(base).mul(count);
  return costOf(base, growth, owned)
    .mul(Decimal.pow(growth, count).sub(1))
    .div(growth - 1);
}

/** How many units `currency` can buy: floor(log_r(C(r−1)/(base·r^owned) + 1)). */
export function maxAffordable(
  base: DecimalSource,
  growth: number,
  owned: number,
  currency: DecimalSource,
): number {
  const money = D(currency);
  const next = costOf(base, growth, owned);
  if (money.lt(next)) return 0;
  if (growth === 1) return Math.floor(money.div(base).toNumber());

  const ratio = money.mul(growth - 1).div(next).add(1);
  let count = Math.floor(ratio.log10().toNumber() / Math.log10(growth));
  // Floating-point correction: make sure the answer really is affordable, and maximal.
  while (count > 0 && bulkCost(base, growth, owned, count).gt(money)) count--;
  while (bulkCost(base, growth, owned, count + 1).lte(money)) count++;
  return count;
}
