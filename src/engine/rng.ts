/**
 * Seeded RNG (mulberry32). The state is a plain number stored in the save,
 * so rolls are reproducible and reloading does not re-roll loot.
 */
export interface RngState {
  state: number;
}

export function createRng(seed: number): RngState {
  return { state: seed >>> 0 };
}

/** Returns a float in [0, 1) and advances the state. */
export function nextFloat(rng: RngState): number {
  rng.state = (rng.state + 0x6d2b79f5) >>> 0;
  let t = rng.state;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** Integer in [min, max] inclusive. */
export function nextInt(rng: RngState, min: number, max: number): number {
  return min + Math.floor(nextFloat(rng) * (max - min + 1));
}

export function chance(rng: RngState, probability: number): boolean {
  return nextFloat(rng) < probability;
}

export function pick<T>(rng: RngState, items: readonly T[]): T {
  if (items.length === 0) throw new Error('pick() from an empty list');
  return items[Math.floor(nextFloat(rng) * items.length)]!;
}

/** Pick by weight, e.g. loot rarity tables. */
export function weightedPick<T>(rng: RngState, entries: readonly { value: T; weight: number }[]): T {
  const total = entries.reduce((sum, e) => sum + Math.max(0, e.weight), 0);
  if (total <= 0) throw new Error('weightedPick() needs a positive total weight');
  let roll = nextFloat(rng) * total;
  for (const entry of entries) {
    roll -= Math.max(0, entry.weight);
    if (roll < 0) return entry.value;
  }
  return entries[entries.length - 1]!.value;
}

/** A fresh seed for a brand-new save. */
export function randomSeed(): number {
  return (Math.random() * 4294967296) >>> 0;
}
