export interface MinionDef {
  id: string;
  name: string;
  description: string;
  /** Price of the first unit, in Bones. */
  baseCost: number;
  /** Price multiplier per unit owned. */
  costGrowth: number;
  /** Damage per second of one unit, before multipliers. */
  baseDps: number;
  /** Extra damage multiplier against bosses (traits). */
  bossDamageMult?: number;
  /** Short trait text shown in the UI. */
  trait?: string;
}

export const MINIONS: readonly MinionDef[] = [
  {
    id: 'skeletonWarrior',
    name: 'Skeleton Warrior',
    description: 'Cheap, plentiful, and not very bright.',
    baseCost: 10,
    costGrowth: 1.07,
    baseDps: 1,
  },
  {
    id: 'skeletalArcher',
    name: 'Skeletal Archer',
    description: 'Fires splinters of its own ribcage.',
    baseCost: 120,
    costGrowth: 1.08,
    baseDps: 8,
    bossDamageMult: 2,
    trait: 'Double damage against bosses.',
  },
  {
    id: 'ghoul',
    name: 'Ghoul',
    description: 'Always hungry. Never full.',
    baseCost: 1_500,
    costGrowth: 1.09,
    baseDps: 70,
  },
  {
    id: 'boneMage',
    name: 'Bone Mage',
    description: 'A scholar who never let death interrupt their studies.',
    baseCost: 25_000,
    costGrowth: 1.1,
    baseDps: 650,
  },
  {
    id: 'wraith',
    name: 'Wraith',
    description: 'A cold draft with a grudge.',
    baseCost: 450_000,
    costGrowth: 1.11,
    baseDps: 6_000,
  },
  {
    id: 'abomination',
    name: 'Abomination',
    description: 'Several bad decisions, stitched together.',
    baseCost: 9_000_000,
    costGrowth: 1.12,
    baseDps: 60_000,
  },
];

export const MINIONS_BY_ID: Readonly<Record<string, MinionDef>> = Object.fromEntries(
  MINIONS.map((m) => [m.id, m]),
);

/** Owning this many of a minion doubles its damage (each threshold stacks). */
export const MINION_MILESTONES: readonly number[] = [10, 25, 50, 100, 150, 200, 250, 300, 400, 500, 600, 700, 800, 900, 1000];
