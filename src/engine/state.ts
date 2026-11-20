import { Decimal } from './bignum';
import type { Notation } from './format';
import { createRng, randomSeed, type RngState } from './rng';
import { MINIONS } from '../content/minions';
import { GRAVEWORKS } from '../content/graveworks';
import { BALANCE } from '../content/balance';
import type { BuffId } from '../content/events';
import type { EquipSlot, ItemKind, Rarity } from '../content/loot';
import { SCHOOL_IDS, type SchoolId, type SpellId } from '../content/spells';
import { ELITES } from '../content/elites';
import { enemyMaxHp } from '../systems/descent';

/** Bump this and add a migration in migrations.ts whenever the save shape changes. */
export const SAVE_VERSION = 5;

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
  /** Set id for set relics. */
  set: string | null;
  /** Gems socketed into this item ("ruby:2"); at most SOCKETS[rarity]. */
  gems: string[];
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
    corpses: number;
  };
  army: {
    minions: Record<string, { owned: number }>;
    /** Elite levels by id. */
    elites: Record<string, number>;
    /** The gem each Elite carries (kept through Rebirth). */
    eliteGems: Record<string, string | null>;
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
    /** Loose gems by key ("ruby:2") → count. */
    gems: Record<string, number>;
  };
  rift: {
    keys: number;
    active: boolean;
    timeLeft: number;
    /** Rift floor being fought (1-based). */
    depth: number;
    enemyHp: Decimal;
    /** Deepest Rift floor ever cleared. */
    best: number;
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
    /** Coven sworn to this run, if any. */
    coven: string | null;
    /** Curses on this run, and the ones chosen for the next. */
    curses: string[];
    nextCurses: string[];
  };
  lich: {
    dread: number;
    dreadEarned: number;
    ascensions: number;
    powers: string[];
    darkLevel: number;
    darkXp: number;
  };
  library: {
    lore: number;
    loreEarned: number;
    completed: string[];
    /** Projects in progress with seconds left. */
    active: { id: string; remaining: number }[];
  };
  /** Feats (achievements) earned, kept forever. */
  feats: string[];
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
    legendariesFound: number;
    corpsesEarned: number;
    riftsRun: number;
    gemsFound: number;
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
    resources: { bones: new Decimal(0), corpses: 0 },
    army: {
      minions: Object.fromEntries(MINIONS.map((m) => [m.id, { owned: 0 }])),
      elites: Object.fromEntries(ELITES.map((e) => [e.id, 0])),
      eliteGems: Object.fromEntries(ELITES.map((e) => [e.id, null])),
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
    loot: { nextId: 1, inventory: [], equipped: {}, dust: 0, autoSalvage: 'none', unseen: 0, gems: {} },
    rift: { keys: 0, active: false, timeLeft: 0, depth: 1, enemyHp: new Decimal(1), best: 0 },
    magic: { essence: 0, cooldowns: {}, autoCast: false, schools: Object.fromEntries(SCHOOL_IDS.map((id) => [id, { level: 0, xp: 0 }])) as Record<SchoolId, { level: number; xp: number }> },
    prestige: { shards: 0, shardsEarned: 0, rebirths: 0, pact: [], autoBuy: false, bestFloor: 1, runStartedAt: 0, coven: null, curses: [], nextCurses: [] },
    lich: { dread: 0, dreadEarned: 0, ascensions: 0, powers: [], darkLevel: 0, darkXp: 0 },
    library: { lore: 0, loreEarned: 0, completed: [], active: [] },
    feats: [],
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
      legendariesFound: 0,
      corpsesEarned: 0,
      riftsRun: 0,
      gemsFound: 0,
    },
    settings: { notation: 'short', buyAmount: 1 },
  };
}
