import type { IconName } from '../ui/icons.generated';

export type SchoolId = 'bone';
export type SpellId = 'boneSpear' | 'raiseLegion' | 'ossuaryRite';

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
  effect: { kind: 'burst'; seconds: number } | { kind: 'buff'; buff: 'raiseLegion' | 'ossuaryRite' };
}

export const SPELLS: readonly SpellDef[] = [
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
    description: 'For 20 seconds, the dead rise again: army damage ×1.5 (more with School of Bone levels).',
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
];

export const SPELLS_BY_ID: Readonly<Record<SpellId, SpellDef>> = Object.fromEntries(SPELLS.map((s) => [s.id, s])) as Record<
  SpellId,
  SpellDef
>;

export const SCHOOLS: Readonly<Record<SchoolId, { name: string; description: string; icon: IconName }>> = {
  bone: { name: 'School of Bone', description: 'Summons, spears and the patient arithmetic of skeletons.', icon: 'skeleton-inside' },
};

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
