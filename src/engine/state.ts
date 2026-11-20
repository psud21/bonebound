import { Decimal } from './bignum';
import type { Notation } from './format';
import { createRng, randomSeed, type RngState } from './rng';
import { MINIONS } from '../content/minions';
import { GRAVEWORKS } from '../content/graveworks';
import { BALANCE } from '../content/balance';
import type { BuffId } from '../content/events';
import type { EquipSlot, ItemKind, Rarity } from '../content/loot';
import type { SchoolId, SpellId } from '../content/spells';
import { enemyMaxHp } from '../systems/descent';

/** Bump this and add a migration in migrations.ts whenever the save shape changes. */
export const SAVE_VERSION = 3;

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

export type LogKind = 'story' | 'boss' | 'event' | 'info' | 'loot';

export interface ItemAffix {
  stat: string;
  /** Quality roll, 0.7 to 1.3. The value is computed from stat, item level, rarity and roll. */
  roll: number;
}

export interface Item {
  id: number;
  kind: ItemKind;
  rarity: Rarity;
  /** Item level (the floor it dropped on). Higher levels mean bigger numbers. */
  level: number;
  name: string;
  implicit: ItemAffix;
  affixes: ItemAffix[];
  legendary: string | null;
  /** Times this item has been Empowered. */
  empowered: number;
}

export type AutoSalvage = 'none' | Rarity;

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
  loot: {
    nextId: number;
    inventory: Item[];
    equipped: Partial<Record<EquipSlot, Item>>;
    dust: number;
    autoSalvage: AutoSalvage;
    /** Items found since the Relics tab was last opened. */
    unseen: number;
  };
  magic: {
    essence: number;
    cooldowns: Partial<Record<SpellId, number>>;
    autoCast: boolean;
    schools: Record<SchoolId, { level: number; xp: number }>;
  };
  prestige: {
    /** Unspent Soul Shards. */
    shards: number;
    /** All Soul Shards ever earned (drives the passive bonus). */
    shardsEarned: number;
    rebirths: number;
    pact: string[];
    autoBuy: boolean;
    /** Deepest floor reached in any run. */
    bestFloor: number;
    /** Play time when this run began. */
    runStartedAt: number;
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
    itemsFound: number;
    spellsCast: number;
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
    loot: { nextId: 1, inventory: [], equipped: {}, dust: 0, autoSalvage: 'none', unseen: 0 },
    magic: { essence: 0, cooldowns: {}, autoCast: false, schools: { bone: { level: 0, xp: 0 } } },
    prestige: { shards: 0, shardsEarned: 0, rebirths: 0, pact: [], autoBuy: false, bestFloor: 1, runStartedAt: 0 },
    unlocks: {},
    log: [],
    stats: {
      lifetimeBones: new Decimal(0),
      totalKills: 0,
      totalClicks: 0,
      bossesDefeated: 0,
      bossesFailed: 0,
      soulsCaught: 0,
      itemsFound: 0,
      spellsCast: 0,
    },
    settings: { notation: 'short', buyAmount: 1 },
  };
}
