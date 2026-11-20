export interface MinionDef {
  id: string;
  name: string;
  description: string;
  /** Price of the first unit, in Bones. */
  baseCost: number;
  /** Price multiplier per unit owned. */
  costGrowth: number;
  /** Damage per second of one unit. */
  baseDps: number;
}

/** M0 content: enough to exercise the engine. The full roster arrives in M1. */
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
    baseDps: 9,
  },
  {
    id: 'ghoul',
    name: 'Ghoul',
    description: 'Always hungry. Never full.',
    baseCost: 1500,
    costGrowth: 1.09,
    baseDps: 80,
  },
];

export const MINIONS_BY_ID: Readonly<Record<string, MinionDef>> = Object.fromEntries(
  MINIONS.map((m) => [m.id, m]),
);
