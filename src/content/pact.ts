import type { IconName } from '../ui/icons.generated';

export type PactEffect =
  | { kind: 'startBones'; amount: number }
  | { kind: 'startMinions'; minions: Readonly<Record<string, number>> }
  | { kind: 'startGraveworks'; graveworks: Readonly<Record<string, number>> }
  | { kind: 'startFloor'; floor: number }
  | { kind: 'keepWardens' }
  | { kind: 'autoBuy' }
  | { kind: 'autoCast' }
  | { kind: 'offlineCap'; seconds: number }
  | { kind: 'soulFrequency'; mult: number }
  | { kind: 'clickMult'; mult: number }
  | { kind: 'essence'; maxBonus: number; regenMult: number }
  | { kind: 'bossTimer'; seconds: number }
  | { kind: 'shardPower'; percent: number };

export interface PactNode {
  id: string;
  name: string;
  description: string;
  icon: IconName;
  cost: number;
  requires: readonly string[];
  /** Row in the tree display (0 = top). */
  tier: number;
  effect: PactEffect;
}

export const PACT_NODES: readonly PactNode[] = [
  // Tier 0
  {
    id: 'graveMemory',
    name: 'Grave Memory',
    description: 'Begin each run with 1,000 Bones.',
    icon: 'tombstone',
    cost: 1,
    requires: [],
    tier: 0,
    effect: { kind: 'startBones', amount: 1000 },
  },
  {
    id: 'sharpSiphon',
    name: 'Hungry Hands',
    description: 'Siphon deals ×3 damage.',
    icon: 'hand-of-god',
    cost: 1,
    requires: [],
    tier: 0,
    effect: { kind: 'clickMult', mult: 3 },
  },
  {
    id: 'soulLure',
    name: 'Soul Lure',
    description: 'Wandering Souls appear 25% more often.',
    icon: 'lantern-flame',
    cost: 2,
    requires: [],
    tier: 0,
    effect: { kind: 'soulFrequency', mult: 1.25 },
  },
  // Tier 1
  {
    id: 'risenVanguard',
    name: 'Risen Vanguard',
    description: 'Begin each run with 15 Skeleton Warriors and 5 Skeletal Archers.',
    icon: 'dark-squad',
    cost: 3,
    requires: ['graveMemory'],
    tier: 1,
    effect: { kind: 'startMinions', minions: { skeletonWarrior: 15, skeletalArcher: 5 } },
  },
  {
    id: 'cryptMemory',
    name: 'Crypt Memory',
    description: 'Begin each run with 10 Shallow Graves and 5 Embalming Pits.',
    icon: 'amphora',
    cost: 3,
    requires: ['graveMemory'],
    tier: 1,
    effect: { kind: 'startGraveworks', graveworks: { shallowGraves: 10, embalmingPit: 5 } },
  },
  {
    id: 'essenceWell',
    name: 'Essence Well',
    description: 'Essence capacity +100 and Essence regenerates 50% faster.',
    icon: 'crystal-ball',
    cost: 4,
    requires: ['sharpSiphon'],
    tier: 1,
    effect: { kind: 'essence', maxBonus: 100, regenMult: 1.5 },
  },
  {
    id: 'patientDead',
    name: 'The Patient Dead',
    description: 'Offline progress lasts up to 4 hours longer.',
    icon: 'time-trap',
    cost: 3,
    requires: ['soulLure'],
    tier: 1,
    effect: { kind: 'offlineCap', seconds: 4 * 3600 },
  },
  // Tier 2
  {
    id: 'autoRaise',
    name: 'Ceaseless Raising',
    description: 'Unlocks automatic minion raising (toggle it in the Army panel).',
    icon: 'raise-skeleton',
    cost: 6,
    requires: ['risenVanguard'],
    tier: 2,
    effect: { kind: 'autoBuy' },
  },
  {
    id: 'deepStart',
    name: 'Shallow Descent',
    description: 'Begin each run on floor 11, past Gravekeeper Morrow.',
    icon: 'stairs',
    cost: 8,
    requires: ['risenVanguard'],
    tier: 2,
    effect: { kind: 'startFloor', floor: 11 },
  },
  {
    id: 'lingeringWardens',
    name: 'Lingering Wardens',
    description: 'Lich Wardens stay hired through Rebirth.',
    icon: 'crowned-skull',
    cost: 10,
    requires: ['cryptMemory'],
    tier: 2,
    effect: { kind: 'keepWardens' },
  },
  {
    id: 'autoCast',
    name: 'Murmured Rites',
    description: 'Unlocks automatic spellcasting (toggle it in the Grimoire).',
    icon: 'spell-book',
    cost: 8,
    requires: ['essenceWell'],
    tier: 2,
    effect: { kind: 'autoCast' },
  },
  {
    id: 'eternalPatience',
    name: 'Eternal Patience',
    description: 'Guardian timer +10 seconds.',
    icon: 'sands-of-time',
    cost: 6,
    requires: ['patientDead'],
    tier: 2,
    effect: { kind: 'bossTimer', seconds: 10 },
  },
  // Tier 3
  {
    id: 'abyssalMomentum',
    name: 'Abyssal Momentum',
    description: 'Begin each run on floor 26.',
    icon: 'vortex',
    cost: 25,
    requires: ['deepStart'],
    tier: 3,
    effect: { kind: 'startFloor', floor: 26 },
  },
  {
    id: 'phylacteryResonance',
    name: 'Phylactery Resonance',
    description: 'Each Soul Shard grants +1% more power (3% instead of 2%).',
    icon: 'crowned-heart',
    cost: 30,
    requires: ['autoCast', 'lingeringWardens'],
    tier: 3,
    effect: { kind: 'shardPower', percent: 1 },
  },
];

export const PACT_BY_ID: Readonly<Record<string, PactNode>> = Object.fromEntries(PACT_NODES.map((p) => [p.id, p]));

export const PRESTIGE = {
  /** Deepest floor needed before Rebirth is possible. */
  MIN_FLOOR: 75,
  /** Each Soul Shard ever earned adds this percent to army damage. */
  SHARD_POWER_PERCENT: 2,
};

/** Soul Shards a Rebirth would grant for reaching `maxFloor` this run. */
export function shardsForFloor(maxFloor: number): number {
  if (maxFloor < PRESTIGE.MIN_FLOOR) return 0;
  return Math.floor((maxFloor - 50) ** 1.5 / 20);
}
