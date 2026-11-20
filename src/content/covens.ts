import type { IconName } from '../ui/icons.generated';
import type { SchoolId } from './spells';

export interface CovenEffects {
  minionDamage?: number;
  bones?: number;
  click?: number;
  guardianDamage?: number;
  spellCost?: number;
  /** Multiplies spell power for one school. */
  schoolPower?: Partial<Record<SchoolId, number>>;
  /** Multiplies cooldowns for one school. */
  schoolCooldown?: Partial<Record<SchoolId, number>>;
  /** Enemies in the Drowned Catacombs can't heal. */
  noRegen?: boolean;
}

/** A coven is chosen once per run and acts like a class. Unlocks after the third Rebirth. */
export interface CovenDef {
  id: string;
  name: string;
  icon: IconName;
  motto: string;
  boons: readonly string[];
  costs: readonly string[];
  effects: CovenEffects;
}

export const COVENS: readonly CovenDef[] = [
  {
    id: 'boneLord',
    name: 'The Bone Lords',
    icon: 'crowned-skull',
    motto: 'More. Always more.',
    boons: ['Minion damage ×3'],
    costs: ['Spells cost 50% more Essence'],
    effects: { minionDamage: 3, spellCost: 1.5 },
  },
  {
    id: 'bloodWitch',
    name: 'The Blood Witches',
    icon: 'witch-flight',
    motto: 'Everything has a price, and we set it.',
    boons: ['Blood spells ×2 power', 'Blood spell cooldowns halved'],
    costs: ['Bones −20%'],
    effects: { schoolPower: { blood: 2 }, schoolCooldown: { blood: 0.5 }, bones: 0.8 },
  },
  {
    id: 'plagueDoctor',
    name: 'The Plague Doctors',
    icon: 'plague-doctor-profile',
    motto: 'We are here to help. You will not enjoy it.',
    boons: ['Plague spells ×2 power', 'Enemies never heal'],
    costs: ['Guardians take 25% less damage'],
    effects: { schoolPower: { plague: 2 }, noRegen: true, guardianDamage: 0.75 },
  },
  {
    id: 'shade',
    name: 'The Shades',
    icon: 'hooded-assassin',
    motto: 'The hand you don’t see.',
    boons: ['Siphon ×10', 'Shadow spells ×2 power'],
    costs: ['Minion damage −40%'],
    effects: { click: 10, schoolPower: { shadow: 2 }, minionDamage: 0.6 },
  },
];

export const COVENS_BY_ID: Readonly<Record<string, CovenDef>> = Object.fromEntries(COVENS.map((c) => [c.id, c]));

/** Rebirths needed before covens are available. */
export const COVEN_UNLOCK_REBIRTHS = 3;
