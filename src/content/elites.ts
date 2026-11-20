import type { IconName } from '../ui/icons.generated';

export type EliteEffect =
  | { kind: 'armyDamage'; perLevel: number }
  | { kind: 'bones'; perLevel: number }
  | { kind: 'essence'; regenPerLevel: number; powerPerLevel: number }
  | { kind: 'guardian'; damagePerLevel: number; timerPerLevel: number; maxTimer: number };

/** Elite minions: a few named champions raised with Corpses and levelled up one at a time. */
export interface EliteDef {
  id: string;
  name: string;
  description: string;
  icon: IconName;
  /** Deepest floor this run needed to raise it. */
  unlockFloor: number;
  /** Corpses for the first level; each level costs `costGrowth` times more. */
  baseCost: number;
  costGrowth: number;
  effect: EliteEffect;
  /** Text with {v} for the current total effect. */
  effectText: string;
}

export const ELITES: readonly EliteDef[] = [
  {
    id: 'graveChampion',
    name: 'Grave Champion',
    description: 'A war hero stitched from three war heroes.',
    icon: 'knight-banner',
    unlockFloor: 15,
    baseCost: 10,
    costGrowth: 1.45,
    effect: { kind: 'armyDamage', perLevel: 0.04 },
    effectText: 'Army damage ×{v}',
  },
  {
    id: 'hierophant',
    name: 'Ossuary Hierophant',
    description: 'Preaches the gospel of thrift to the dead.',
    icon: 'skull-in-jar',
    unlockFloor: 30,
    baseCost: 25,
    costGrowth: 1.45,
    effect: { kind: 'bones', perLevel: 0.04 },
    effectText: 'Bones ×{v}',
  },
  {
    id: 'lichAcolyte',
    name: 'Lich Acolyte',
    description: 'Apprentice to nobody, which is the best kind of apprentice.',
    icon: 'warlock-hood',
    unlockFloor: 35,
    baseCost: 35,
    costGrowth: 1.32,
    effect: { kind: 'essence', regenPerLevel: 0.08, powerPerLevel: 0.02 },
    effectText: 'Essence regeneration +{v}%, spell power +{w}%',
  },
  {
    id: 'fleshColossus',
    name: 'Flesh Colossus',
    description: 'Too big for the stairs. Takes the walls instead.',
    icon: 'troll',
    unlockFloor: 60,
    baseCost: 60,
    costGrowth: 1.32,
    effect: { kind: 'guardian', damagePerLevel: 0.05, timerPerLevel: 0.5, maxTimer: 15 },
    effectText: 'Guardian damage ×{v}, guardian timer +{w}s',
  },
];

export const ELITES_BY_ID: Readonly<Record<string, EliteDef>> = Object.fromEntries(ELITES.map((e) => [e.id, e]));

export const CORPSES = {
  /** Corpses per normal kill and per guardian kill, before multipliers. */
  PER_KILL: 1,
  PER_GUARDIAN: 10,
  /** Each Ghoul adds this fraction to Corpses gained. */
  PER_GHOUL: 0.01,
  /** Deepest floor needed before kills yield Corpses. */
  UNLOCK_FLOOR: 15,
};
