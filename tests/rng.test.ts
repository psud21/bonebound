import { describe, expect, it } from 'vitest';
import { chance, createRng, nextFloat, nextInt, pick, weightedPick } from '../src/engine/rng';

describe('seeded RNG', () => {
  it('is deterministic for a seed', () => {
    const a = createRng(1234);
    const b = createRng(1234);
    const seqA = Array.from({ length: 10 }, () => nextFloat(a));
    const seqB = Array.from({ length: 10 }, () => nextFloat(b));
    expect(seqA).toEqual(seqB);
  });

  it('differs between seeds', () => {
    expect(nextFloat(createRng(1))).not.toBe(nextFloat(createRng(2)));
  });

  it('continues the same sequence after the state is saved and restored', () => {
    const rng = createRng(99);
    nextFloat(rng);
    nextFloat(rng);
    const restored = JSON.parse(JSON.stringify(rng));
    expect(nextFloat(restored)).toBe(nextFloat(rng));
  });

  it('stays in range', () => {
    const rng = createRng(5);
    for (let i = 0; i < 10_000; i++) {
      const f = nextFloat(rng);
      expect(f).toBeGreaterThanOrEqual(0);
      expect(f).toBeLessThan(1);
      const n = nextInt(rng, 3, 7);
      expect(n).toBeGreaterThanOrEqual(3);
      expect(n).toBeLessThanOrEqual(7);
    }
  });

  it('nextInt covers every value', () => {
    const rng = createRng(8);
    const seen = new Set<number>();
    for (let i = 0; i < 1000; i++) seen.add(nextInt(rng, 1, 6));
    expect([...seen].sort()).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('weightedPick respects weights roughly', () => {
    const rng = createRng(42);
    const counts = { common: 0, rare: 0 };
    const table = [
      { value: 'common' as const, weight: 9 },
      { value: 'rare' as const, weight: 1 },
    ];
    for (let i = 0; i < 20_000; i++) counts[weightedPick(rng, table)]++;
    expect(counts.rare / 20_000).toBeGreaterThan(0.08);
    expect(counts.rare / 20_000).toBeLessThan(0.12);
  });

  it('chance and pick work', () => {
    const rng = createRng(3);
    expect(chance(rng, 0)).toBe(false);
    expect(chance(rng, 1)).toBe(true);
    expect(['a', 'b', 'c']).toContain(pick(rng, ['a', 'b', 'c']));
    expect(() => pick(rng, [])).toThrow();
  });
});
