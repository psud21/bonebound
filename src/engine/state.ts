import { Decimal } from './bignum';
import type { Notation } from './format';
import { createRng, randomSeed, type RngState } from './rng';
import { MINIONS } from '../content/minions';
import { GRAVEWORKS } from '../content/graveworks';
import { BALANCE } from '../content/balance';
import type { BuffId } from '../content/events';
import { enemyMaxHp } from '../systems/descent';

/** Bump this and add a migration in migrations.ts whenever the save shape changes. */
export const SAVE_VERSION = 2;

export type BuyAmount = 1 | 10 | 100 | 'max';

export interface GraveworksState {
  owned: number;
  /** Progress through the current cycle, 0..1. */
  progress: number;
  /** A manual cycle is running (graveworks with a Warden always run). */
  running: boolean;
  warden: boolean;
}

export interface SoulState {
  timeLeft: number;
  /** Screen position in percent, so it fits any window size. */
  x: number;
  y: number;
}

export type LogKind = 'story' | 'boss' | 'event' | 'info';

export interface LogEntry {
  /** Wall-clock time of the entry. */
  at: number;
  kind: LogKind;
  text: string;
}

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
  crypt: {
    graveworks: Record<string, GraveworksState>;
  };
  upgrades: {
    purchased: string[];
  };
  descent: {
    floor: number;
    maxFloor: number;
    killsOnFloor: number;
    enemyHp: Decimal;
    /** False after losing to a boss: the army farms the current floor until the player challenges again. */
    autoAdvance: boolean;
    bossTimeLeft: number;
  };
  events: {
    /** Seconds until the next Wandering Soul appears. */
    soulCooldown: number;
    soul: SoulState | null;
    /** Seconds left on each active buff. */
    buffs: Partial<Record<BuffId, number>>;
  };
  unlocks: Record<string, boolean>;
  log: LogEntry[];
  stats: {
    lifetimeBones: Decimal;
    totalKills: number;
    totalClicks: number;
    bossesDefeated: number;
    bossesFailed: number;
    soulsCaught: number;
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
    crypt: {
      graveworks: Object.fromEntries(
        GRAVEWORKS.map((g) => [g.id, { owned: 0, progress: 0, running: false, warden: false }]),
      ),
    },
    upgrades: { purchased: [] },
    descent: {
      floor: 1,
      maxFloor: 1,
      killsOnFloor: 0,
      enemyHp: enemyMaxHp(1),
      autoAdvance: true,
      bossTimeLeft: BALANCE.BOSS_TIMER_SECONDS,
    },
    events: { soulCooldown: BALANCE.SOUL_MIN_DELAY, soul: null, buffs: {} },
    unlocks: {},
    log: [],
    stats: {
      lifetimeBones: new Decimal(0),
      totalKills: 0,
      totalClicks: 0,
      bossesDefeated: 0,
      bossesFailed: 0,
      soulsCaught: 0,
    },
    settings: { notation: 'short', buyAmount: 1 },
  };
}
