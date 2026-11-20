import type { IconName } from '../ui/icons.generated';

// ---------- Abyssal Rifts ----------

export const RIFT = {
  /** Deepest floor (any run) needed before Rifts open. */
  UNLOCK_FLOOR: 301,
  /** Seconds a Rift stays open. */
  SECONDS: 600,
  /** Rift depth d is as tough as a guardian on floor BASE_FLOOR + FLOORS_PER_DEPTH × d. */
  BASE_FLOOR: 100,
  FLOORS_PER_DEPTH: 10,
  /** Each Rift depth is one enemy with this many times a normal enemy's HP. */
  HP_MULT: 10,
  /** Guardians on floors at least this deep drop a Rift Key the first time they fall each run. */
  KEY_FLOOR: 301,
  /** Each level of your best Rift adds this percent to army damage. */
  MASTERY_PERCENT: 3,
  /** Rift depth needed for a guaranteed legendary. */
  LEGENDARY_DEPTH: 20,
};

// ---------- Curses ----------

export interface CurseDef {
  id: string;
  name: string;
  description: string;
  icon: IconName;
  /** Extra Soul Shards from this run's Rebirth, as a fraction (0.25 = +25%). */
  shardBonus: number;
  effect:
    | { kind: 'damage'; mult: number }
    | { kind: 'noSiphon' }
    | { kind: 'minionCost'; mult: number }
    | { kind: 'bossTimer'; seconds: number }
    | { kind: 'crypt'; mult: number };
}

export const CURSES: readonly CurseDef[] = [
  { id: 'feebleDead', name: 'The Feeble Dead', description: 'Your army and Siphon deal half damage.', icon: 'goo-skull', shardBonus: 0.3, effect: { kind: 'damage', mult: 0.5 } },
  { id: 'stillHands', name: 'Still Hands', description: 'Siphon does nothing.', icon: 'skeletal-hand', shardBonus: 0.15, effect: { kind: 'noSiphon' } },
  { id: 'costlyDead', name: 'The Costly Dead', description: 'Minions cost twice as much.', icon: 'two-coins', shardBonus: 0.25, effect: { kind: 'minionCost', mult: 2 } },
  { id: 'impatience', name: 'Impatience', description: 'Guardian timers are 10 seconds shorter.', icon: 'sands-of-time', shardBonus: 0.2, effect: { kind: 'bossTimer', seconds: -10 } },
  { id: 'barrenCrypt', name: 'Barren Crypt', description: 'The Crypt produces a quarter as much.', icon: 'graveyard', shardBonus: 0.2, effect: { kind: 'crypt', mult: 0.25 } },
];

export const CURSES_BY_ID: Readonly<Record<string, CurseDef>> = Object.fromEntries(CURSES.map((c) => [c.id, c]));

/** Rebirths needed before Curses can be chosen. */
export const CURSE_UNLOCK_REBIRTHS = 5;
/** Each active curse adds this percent item find. */
export const CURSE_LOOT_PERCENT = 20;

// ---------- Lichdom ----------

export type LichEffect =
  | { kind: 'shardGain'; mult: number }
  | { kind: 'armyDamage'; mult: number }
  | { kind: 'gaze'; click: number; spells: number }
  | { kind: 'freePact'; ids: readonly string[] }
  | { kind: 'startFloor'; floor: number }
  | { kind: 'researchSpeed'; mult: number }
  | { kind: 'shardPower'; percent: number }
  | { kind: 'riftTime'; seconds: number };

export interface LichPowerDef {
  id: string;
  name: string;
  description: string;
  icon: IconName;
  cost: number;
  requires: readonly string[];
  effect: LichEffect;
}

export const LICH_POWERS: readonly LichPowerDef[] = [
  { id: 'dreadHarvest', name: 'Dread Harvest', description: 'Soul Shards from Rebirth ×2.', icon: 'soul-vessel', cost: 1, requires: [], effect: { kind: 'shardGain', mult: 2 } },
  { id: 'undyingHost', name: 'The Undying Host', description: 'Army damage ×3.', icon: 'dark-squad', cost: 1, requires: [], effect: { kind: 'armyDamage', mult: 3 } },
  { id: 'boundRites', name: 'Bound Rites', description: 'Ceaseless Raising, Murmured Rites and Lingering Wardens are always yours.', icon: 'spell-book', cost: 2, requires: ['undyingHost'], effect: { kind: 'freePact', ids: ['autoRaise', 'autoCast', 'lingeringWardens'] } },
  { id: 'lichsGaze', name: 'The Lich’s Gaze', description: 'Siphon ×10 and spell power ×1.5.', icon: 'crystal-eye', cost: 2, requires: ['dreadHarvest'], effect: { kind: 'gaze', click: 10, spells: 1.5 } },
  { id: 'abyssalStride', name: 'Abyssal Stride', description: 'Begin each run on floor 201.', icon: 'stairs', cost: 3, requires: ['boundRites'], effect: { kind: 'startFloor', floor: 201 } },
  { id: 'eternalLibrary', name: 'The Eternal Library', description: 'Research finishes three times as fast.', icon: 'bookshelf', cost: 3, requires: ['lichsGaze'], effect: { kind: 'researchSpeed', mult: 3 } },
  { id: 'riftWalker', name: 'Rift Walker', description: 'Rifts stay open 5 minutes longer.', icon: 'magic-portal', cost: 4, requires: ['eternalLibrary'], effect: { kind: 'riftTime', seconds: 300 } },
  { id: 'dreadCrown', name: 'The Dread Crown', description: 'Each Soul Shard grants +2% more power.', icon: 'crowned-skull', cost: 5, requires: ['abyssalStride', 'eternalLibrary'], effect: { kind: 'shardPower', percent: 2 } },
  { id: 'voidWalker', name: 'Void Walker', description: 'Begin each run on floor 401.', icon: 'vortex', cost: 8, requires: ['dreadCrown'], effect: { kind: 'startFloor', floor: 401 } },
];

export const LICH_POWERS_BY_ID: Readonly<Record<string, LichPowerDef>> = Object.fromEntries(LICH_POWERS.map((p) => [p.id, p]));

export const LICHDOM = {
  /** Deepest floor needed before Ascension. */
  MIN_FLOOR: 401,
  /** Each Dread ever earned adds this percent to army damage and Bones. */
  DREAD_POWER_PERCENT: 50,
  /** Each Dark Level adds this percent to army damage. */
  DARK_LEVEL_PERCENT: 3,
};

/** Dread from an Ascension, from all Soul Shards earned since the last one. */
export function dreadForShards(shardsEarned: number): number {
  return Math.floor(Math.sqrt(shardsEarned / 400));
}

/** Dark experience needed from `level` to `level + 1`. */
export function darkXpForLevel(level: number): number {
  return Math.round(100 * 1.12 ** level);
}

/** Dark experience for clearing a floor for the first time in a run, once a Lich. */
export function darkXpForFloor(floor: number): number {
  return Math.max(1, Math.floor(floor / 50));
}
