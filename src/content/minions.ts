import type { IconName } from '../ui/icons.generated';

export interface MinionDef {
  id: string;
  icon: IconName;
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
  /** Unaffected by the Ashen Wastes burn. */
  burnImmune?: boolean;
  /** Each unit adds this fraction to the damage of every lower-tier minion. */
  lowerTierBoost?: number;
  /** Each unit strips this fraction of a guardian's HP when the fight starts (capped). */
  guardianShred?: number;
  /** Can't be raised until this floor has been reached in any run. */
  requiresFloor?: number;
  /** Damage multiplier on swarm floors (the Flesh Gardens). */
  swarmMult?: number;
  /** Ignores consecrated guardians (the Cathedral Inverted). */
  holyPierce?: boolean;
}

export const MINIONS: readonly MinionDef[] = [
  {
    id: 'skeletonWarrior',
    icon: 'skeleton',
    name: 'Skeleton Warrior',
    description: 'Cheap, plentiful, and not very bright.',
    baseCost: 10,
    costGrowth: 1.07,
    baseDps: 1,
  },
  {
    id: 'skeletalArcher',
    icon: 'bowman',
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
    icon: 'shambling-zombie',
    name: 'Ghoul',
    description: 'Always hungry. Never full.',
    baseCost: 1_500,
    costGrowth: 1.09,
    baseDps: 70,
  },
  {
    id: 'boneMage',
    icon: 'skull-staff',
    name: 'Bone Mage',
    description: 'A scholar who never let death interrupt their studies.',
    baseCost: 25_000,
    costGrowth: 1.1,
    baseDps: 650,
    swarmMult: 3,
    trait: 'Splash damage: ×3 damage in the Flesh Gardens.',
  },
  {
    id: 'wraith',
    icon: 'spectre',
    name: 'Wraith',
    description: 'A cold draft with a grudge.',
    baseCost: 450_000,
    costGrowth: 1.11,
    baseDps: 6_000,
    holyPierce: true,
    trait: 'Passes through holy wards: full damage to consecrated guardians.',
  },
  {
    id: 'abomination',
    icon: 'frankenstein-creature',
    name: 'Abomination',
    description: 'Several bad decisions, stitched together.',
    baseCost: 9_000_000,
    costGrowth: 1.12,
    baseDps: 60_000,
  },
  {
    id: 'boneGolem',
    icon: 'rock-golem',
    name: 'Bone Golem',
    description: 'A cathedral of femurs that learned to walk.',
    baseCost: 200_000_000,
    costGrowth: 1.13,
    baseDps: 600_000,
    burnImmune: true,
    trait: 'Immune to the Ashen Wastes burn.',
  },
  {
    id: 'deathKnight',
    icon: 'mounted-knight',
    name: 'Death Knight',
    description: 'Swore an oath to a king long since dust. Now swears it to you.',
    baseCost: 5_000_000_000,
    costGrowth: 1.14,
    baseDps: 6_000_000,
    lowerTierBoost: 0.02,
    trait: 'Each one gives +2% damage to every lower-tier minion.',
  },
  {
    id: 'banshee',
    icon: 'haunting',
    name: 'Banshee',
    description: 'Her scream arrives a moment before you do.',
    baseCost: 150_000_000_000,
    costGrowth: 1.15,
    baseDps: 60_000_000,
    guardianShred: 0.005,
    trait: 'Each one strips 0.5% of a guardian’s HP as the fight begins (up to 40%).',
  },
  {
    id: 'dracolich',
    icon: 'spiked-dragon-head',
    name: 'Dracolich',
    description: 'The Drowned King’s bones, rebuilt with wings and a grudge.',
    baseCost: 5_000_000_000_000,
    costGrowth: 1.16,
    baseDps: 700_000_000,
    bossDamageMult: 2,
    requiresFloor: 201,
    trait: 'Double damage against guardians. Raised only after the Drowned King falls.',
  },
];

/** Banshees can strip at most this fraction of a guardian's HP. */
export const MAX_GUARDIAN_SHRED = 0.4;

export const MINIONS_BY_ID: Readonly<Record<string, MinionDef>> = Object.fromEntries(
  MINIONS.map((m) => [m.id, m]),
);

/** Owning this many of a minion doubles its damage (each threshold stacks). */
export const MINION_MILESTONES: readonly number[] = [10, 25, 50, 100, 150, 200, 250, 300, 400, 500, 600, 700, 800, 900, 1000];
