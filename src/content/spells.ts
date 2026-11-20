import type { IconName } from '../ui/icons.generated';

export type SchoolId = 'bone' | 'blood' | 'plague' | 'shadow';
export type SpellId =
  | 'boneSpear'
  | 'raiseLegion'
  | 'ossuaryRite'
  | 'bloodRite'
  | 'hemorrhage'
  | 'crimsonTithe'
  | 'plagueWind'
  | 'rot'
  | 'pestilence'
  | 'curseOfFrailty'
  | 'soulDrain'
  | 'eclipse';

/** Timed spell effects (they live alongside the Wandering Soul buffs). */
export type SpellBuff = 'raiseLegion' | 'ossuaryRite' | 'bloodRite' | 'plagueWind' | 'rot' | 'pestilence' | 'curseOfFrailty' | 'eclipse';

export type SpellEffect =
  /** Deals this many seconds of army damage at once. */
  | { kind: 'burst'; seconds: number }
  | { kind: 'buff'; buff: SpellBuff }
  /** Sacrifices a share of every minion type, then applies a buff. */
  | { kind: 'sacrifice'; buff: SpellBuff; percent: number }
  /** Strips a percent of the current enemy's max HP. */
  | { kind: 'hpPercent'; normal: number; guardian: number }
  /** Grants this many seconds of current income. */
  | { kind: 'income'; seconds: number }
  /** Deals army damage and restores Essence. */
  | { kind: 'drain'; seconds: number; essence: number };

export interface SpellDef {
  id: SpellId;
  school: SchoolId;
  name: string;
  description: string;
  icon: IconName;
  /** Essence cost. */
  cost: number;
  /** Seconds between casts. */
  cooldown: number;
  /** School level needed to learn it. */
  unlockLevel: number;
  effect: SpellEffect;
}

export const SPELLS: readonly SpellDef[] = [
  // Bone
  {
    id: 'boneSpear',
    school: 'bone',
    name: 'Bone Spear',
    description: 'Hurl a lance of bone: deals 8 seconds of army damage at once.',
    icon: 'thrown-spear',
    cost: 20,
    cooldown: 20,
    unlockLevel: 0,
    effect: { kind: 'burst', seconds: 8 },
  },
  {
    id: 'raiseLegion',
    school: 'bone',
    name: 'Raise Legion',
    description: 'For 20 seconds, the dead rise again: army damage ×1.5 (more with school levels).',
    icon: 'rally-the-troops',
    cost: 50,
    cooldown: 60,
    unlockLevel: 3,
    effect: { kind: 'buff', buff: 'raiseLegion' },
  },
  {
    id: 'ossuaryRite',
    school: 'bone',
    name: 'Ossuary Rite',
    description: 'For 30 seconds, graveworks cycle three times as fast.',
    icon: 'skeleton-inside',
    cost: 40,
    cooldown: 90,
    unlockLevel: 5,
    effect: { kind: 'buff', buff: 'ossuaryRite' },
  },
  // Blood
  {
    id: 'bloodRite',
    school: 'blood',
    name: 'Blood Rite',
    description: 'Sacrifice 10% of every minion type. For 15 seconds, army damage ×4 (more with school levels).',
    icon: 'bleeding-heart',
    cost: 30,
    cooldown: 60,
    unlockLevel: 0,
    effect: { kind: 'sacrifice', buff: 'bloodRite', percent: 10 },
  },
  {
    id: 'hemorrhage',
    school: 'blood',
    name: 'Hemorrhage',
    description: 'Open every vein at once: the current enemy loses 30% of its HP (guardians 4%).',
    icon: 'bloody-sword',
    cost: 25,
    cooldown: 30,
    unlockLevel: 3,
    effect: { kind: 'hpPercent', normal: 30, guardian: 4 },
  },
  {
    id: 'crimsonTithe',
    school: 'blood',
    name: 'Crimson Tithe',
    description: 'Collect what is owed: gain 2 minutes of Bone income at once.',
    icon: 'heart-drop',
    cost: 40,
    cooldown: 120,
    unlockLevel: 6,
    effect: { kind: 'income', seconds: 120 },
  },
  // Plague
  {
    id: 'plagueWind',
    school: 'plague',
    name: 'Plague Wind',
    description: 'For 20 seconds, a sickly wind adds 50% to army damage and stops enemies from healing.',
    icon: 'poison-cloud',
    cost: 25,
    cooldown: 40,
    unlockLevel: 0,
    effect: { kind: 'buff', buff: 'plagueWind' },
  },
  {
    id: 'rot',
    school: 'plague',
    name: 'Rot',
    description: 'For 30 seconds, flesh softens: enemies take 40% more damage.',
    icon: 'poison-bottle',
    cost: 35,
    cooldown: 75,
    unlockLevel: 3,
    effect: { kind: 'buff', buff: 'rot' },
  },
  {
    id: 'pestilence',
    school: 'plague',
    name: 'Pestilence',
    description: 'For 20 seconds, sickness leaps between foes: double damage to non-guardian enemies.',
    icon: 'poison-gas',
    cost: 45,
    cooldown: 90,
    unlockLevel: 6,
    effect: { kind: 'buff', buff: 'pestilence' },
  },
  // Shadow
  {
    id: 'curseOfFrailty',
    school: 'shadow',
    name: 'Curse of Frailty',
    description: 'For 25 seconds, guardians take double damage.',
    icon: 'cursed-star',
    cost: 35,
    cooldown: 60,
    unlockLevel: 0,
    effect: { kind: 'buff', buff: 'curseOfFrailty' },
  },
  {
    id: 'soulDrain',
    school: 'shadow',
    name: 'Soul Drain',
    description: 'Drink from the enemy: deals 5 seconds of army damage and restores 30 Essence.',
    icon: 'shadow-grasp',
    cost: 5,
    cooldown: 45,
    unlockLevel: 3,
    effect: { kind: 'drain', seconds: 5, essence: 30 },
  },
  {
    id: 'eclipse',
    school: 'shadow',
    name: 'Eclipse',
    description: 'For 15 seconds, the light goes out: Siphon ×10 and army damage ×1.5.',
    icon: 'moon-orbit',
    cost: 60,
    cooldown: 120,
    unlockLevel: 6,
    effect: { kind: 'buff', buff: 'eclipse' },
  },
];

export const SPELLS_BY_ID: Readonly<Record<SpellId, SpellDef>> = Object.fromEntries(SPELLS.map((s) => [s.id, s])) as Record<
  SpellId,
  SpellDef
>;

export interface SchoolDef {
  id: SchoolId;
  name: string;
  description: string;
  icon: IconName;
  /** How the school opens, for locked previews. */
  unlockHint: string;
}

export const SCHOOLS: Readonly<Record<SchoolId, SchoolDef>> = {
  bone: {
    id: 'bone',
    name: 'School of Bone',
    description: 'Summons, spears and the patient arithmetic of skeletons.',
    icon: 'skeleton-inside',
    unlockHint: 'Reach floor 30.',
  },
  blood: {
    id: 'blood',
    name: 'School of Blood',
    description: 'Sacrifice now, power now. Pay later.',
    icon: 'bleeding-heart',
    unlockHint: 'Perform your first Rebirth.',
  },
  plague: {
    id: 'plague',
    name: 'School of Plague',
    description: 'Slow, patient, contagious. It works on the drowned, too.',
    icon: 'poison-cloud',
    unlockHint: 'Enter the Drowned Catacombs (floor 101).',
  },
  shadow: {
    id: 'shadow',
    name: 'School of Shadow',
    description: 'Curses, theft and the space between heartbeats.',
    icon: 'cursed-star',
    unlockHint: 'Perform your second Rebirth.',
  },
};

export const SCHOOL_IDS: readonly SchoolId[] = ['bone', 'blood', 'plague', 'shadow'];

/** Experience needed to go from `level` to `level + 1`. */
export function schoolXpForLevel(level: number): number {
  return Math.round(40 * 1.45 ** level);
}

/** Spell effects scale with school level. */
export function schoolPower(level: number): number {
  return 1 + 0.05 * level;
}

export const ESSENCE = {
  BASE_MAX: 100,
  BASE_REGEN: 1,
};
