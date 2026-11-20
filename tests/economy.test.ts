import { describe, expect, it } from 'vitest';
import { D } from '../src/engine/bignum';
import { bulkCost, costOf, maxAffordable } from '../src/engine/economy';

const near = (a: ReturnType<typeof D>, b: number) => expect(a.toNumber()).toBeCloseTo(b, 6);

describe('costOf', () => {
  it('is base × r^owned', () => {
    near(costOf(10, 1.07, 0), 10);
    near(costOf(10, 1.07, 1), 10.7);
    near(costOf(10, 1.07, 10), 10 * 1.07 ** 10);
  });

  it('handles very large owned counts without overflow', () => {
    const c = costOf(10, 1.15, 10_000);
    expect(c.log10().toNumber()).toBeCloseTo(1 + 10_000 * Math.log10(1.15), 6);
  });
});

describe('bulkCost', () => {
  it('equals the sum of buying one at a time', () => {
    for (const owned of [0, 3, 57]) {
      let sum = 0;
      for (let i = 0; i < 25; i++) sum += costOf(10, 1.07, owned + i).toNumber();
      expect(bulkCost(10, 1.07, owned, 25).toNumber() / sum).toBeCloseTo(1, 10);
    }
  });

  it('is zero for zero or negative counts', () => {
    expect(bulkCost(10, 1.07, 5, 0).eq(0)).toBe(true);
    expect(bulkCost(10, 1.07, 5, -3).eq(0)).toBe(true);
  });

  it('handles growth of exactly 1', () => {
    near(bulkCost(10, 1, 4, 5), 50);
  });
});

describe('maxAffordable', () => {
  it('returns 0 when the next unit is too expensive', () => {
    expect(maxAffordable(10, 1.07, 0, 9.99)).toBe(0);
  });

  it('counts an exactly affordable purchase', () => {
    const exact = bulkCost(10, 1.07, 0, 7);
    expect(maxAffordable(10, 1.07, 0, exact)).toBe(7);
  });

  it('is always affordable and always maximal', () => {
    for (const money of [10, 55, 1234, 1e6, 3.7e9]) {
      for (const owned of [0, 12, 140]) {
        const k = maxAffordable(10, 1.08, owned, money);
        expect(bulkCost(10, 1.08, owned, k).lte(money)).toBe(true);
        expect(bulkCost(10, 1.08, owned, k + 1).gt(money)).toBe(true);
      }
    }
  });

  it('works with astronomically large currency', () => {
    const k = maxAffordable(10, 1.07, 0, D('1e500'));
    expect(k).toBeGreaterThan(16_000);
    expect(bulkCost(10, 1.07, 0, k).lte(D('1e500'))).toBe(true);
  });
});
