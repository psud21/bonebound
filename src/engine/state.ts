import { Decimal } from './bignum';
import type { Notation } from './format';
import { createRng, randomSeed, type RngState } from './rng';
import { MINIONS } from '../content/minions';
import { floorMaxHp } from '../systems/descent';

/** Bump this and add a migration in migrations.ts whenever the save shape changes. */
export const SAVE_VERSION = 1;

export type BuyAmount = 1 | 10 | 100 | 'max';

export interface GameState {
  version: number;
  meta: {
    createdAt: number;
    /** Wall-clock time the game last ran a tick (used for offline progress). */
    lastActiveAt: number;
    lastSavedAt: number;
    playTimeSeconds: number;
  };
  rng: RngState;
  resources: {
    bones: Decimal;
  };
  army: {
    minions: Record<string, { owned: number }>;
  };
  descent: {
    floor: number;
    maxFloor: number;
    killsOnFloor: number;
    enemyHp: Decimal;
  };
  stats: {
    lifetimeBones: Decimal;
    totalKills: number;
    totalClicks: number;
  };
  settings: {
    notation: Notation;
    buyAmount: BuyAmount;
  };
}

export function createInitialState(now: number = Date.now(), seed: number = randomSeed()): GameState {
  return {
    version: SAVE_VERSION,
    meta: { createdAt: now, lastActiveAt: now, lastSavedAt: 0, playTimeSeconds: 0 },
    rng: createRng(seed),
    resources: { bones: new Decimal(0) },
    army: {
      minions: Object.fromEntries(MINIONS.map((m) => [m.id, { owned: 0 }])),
    },
    descent: { floor: 1, maxFloor: 1, killsOnFloor: 0, enemyHp: floorMaxHp(1) },
    stats: { lifetimeBones: new Decimal(0), totalKills: 0, totalClicks: 0 },
    settings: { notation: 'short', buyAmount: 1 },
  };
}
