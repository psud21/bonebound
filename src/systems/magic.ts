import type { GameState } from '../engine/state';
import { BUFFS } from '../content/events';
import {
  ESSENCE,
  SCHOOLS,
  SPELLS,
  SPELLS_BY_ID,
  schoolPower,
  schoolXpForLevel,
  type SchoolId,
  type SpellBuff,
  type SpellId,
} from '../content/spells';
import { armyDps } from './army';
import { covenEffects } from './covens';
import { dealDamage, enemyMaxHp, onBossFloor } from './descent';
import { eliteEssenceRegen, eliteSpellPower } from './elites';
import { applyBuff } from './events';
import { gearStat, hasLegendary } from './gear';
import { totalIncome } from './income';
import { researchEffects, researchProduct } from './library';
import { addLog } from './log';
import { hasPact, pactEffects } from './prestige';
import { addBones } from './resources';

export function magicUnlocked(state: GameState): boolean {
  return state.unlocks.essence === true;
}

/** Whether a school's spells can be learned yet. */
export function schoolUnlocked(state: GameState, school: SchoolId): boolean {
  if (!magicUnlocked(state)) return false;
  switch (school) {
    case 'bone':
      return true;
    case 'blood':
      return state.prestige.rebirths >= 1;
    case 'plague':
      return Math.max(state.prestige.bestFloor, state.descent.maxFloor) >= 101;
    case 'shadow':
      return state.prestige.rebirths >= 2;
  }
}

export function essenceMax(state: GameState): number {
  return (
    ESSENCE.BASE_MAX +
    pactEffects(state, 'essence').reduce((s, e) => s + e.maxBonus, 0) +
    researchEffects(state, 'essence').reduce((s, e) => s + e.maxBonus, 0)
  );
}

export function essenceRegen(state: GameState): number {
  const pact = pactEffects(state, 'essence').reduce((m, e) => m * e.regenMult, 1);
  const research = researchEffects(state, 'essence').reduce((m, e) => m * e.regenMult, 1);
  return ESSENCE.BASE_REGEN * (1 + gearStat(state, 'essenceRegen') / 100) * pact * research * eliteEssenceRegen(state);
}

export function schoolLevel(state: GameState, school: SchoolId): number {
  return state.magic.schools[school]?.level ?? 0;
}

/** Multiplier on one school's spells from covens and set bonuses. */
function schoolBonus(state: GameState, school: SchoolId): number {
  const coven = covenEffects(state).schoolPower?.[school] ?? 1;
  const gear = hasLegendary(state, 'schoolPower').reduce((m, e) => (e.school === school ? m * e.mult : m), 1);
  return coven * gear;
}

export function spellPower(state: GameState, id: SpellId): number {
  const school = SPELLS_BY_ID[id].school;
  return schoolPower(schoolLevel(state, school)) * eliteSpellPower(state) * schoolBonus(state, school);
}

export function spellCost(state: GameState, id: SpellId): number {
  return Math.round(SPELLS_BY_ID[id].cost * (covenEffects(state).spellCost ?? 1));
}

export function spellCooldown(state: GameState, id: SpellId): number {
  const school = SPELLS_BY_ID[id].school;
  const coven = covenEffects(state).schoolCooldown?.[school] ?? 1;
  const gear = hasLegendary(state, 'schoolCooldown').reduce((m, e) => (e.school === school ? m * e.mult : m), 1);
  return SPELLS_BY_ID[id].cooldown * researchProduct(state, 'cooldown') * coven * gear;
}

export function spellKnown(state: GameState, id: SpellId): boolean {
  const spell = SPELLS_BY_ID[id];
  return schoolUnlocked(state, spell.school) && schoolLevel(state, spell.school) >= spell.unlockLevel;
}

export function spellReady(state: GameState, id: SpellId): boolean {
  return (
    magicUnlocked(state) &&
    spellKnown(state, id) &&
    (state.magic.cooldowns[id] ?? 0) <= 0 &&
    state.magic.essence >= spellCost(state, id)
  );
}

/**
 * The strength of a spell buff while it's active, scaled by the caster's power.
 * `part` picks Eclipse's Siphon multiplier instead of its army multiplier.
 */
export function spellBuffValue(state: GameState, buff: SpellBuff, part: 'army' | 'click' = 'army'): number {
  const p = spellPower(state, buff);
  switch (buff) {
    case 'raiseLegion':
      return 1 + 0.5 * p;
    case 'bloodRite':
      return 1 + 3 * p;
    case 'plagueWind':
      return 1 + 0.5 * p;
    case 'rot':
      return 1 + 0.4 * p;
    case 'pestilence':
    case 'curseOfFrailty':
      return 1 + p;
    case 'eclipse':
      return part === 'click' ? p : 1 + 0.5 * p;
    case 'ossuaryRite':
      return 3;
  }
}

/** Raise Legion's damage multiplier, which grows with School of Bone level. */
export function raiseLegionMultiplier(state: GameState): number {
  return spellBuffValue(state, 'raiseLegion');
}

function gainSchoolXp(state: GameState, school: SchoolId, xp: number): void {
  const s = (state.magic.schools[school] ??= { level: 0, xp: 0 });
  s.xp += xp;
  while (s.xp >= schoolXpForLevel(s.level)) {
    s.xp -= schoolXpForLevel(s.level);
    s.level += 1;
    const learned = SPELLS.filter((sp) => sp.school === school && sp.unlockLevel === s.level);
    addLog(
      state,
      'event',
      `${SCHOOLS[school].name} reached level ${s.level}.` +
        (learned.length ? ` You learned ${learned.map((l) => l.name).join(', ')}.` : ''),
    );
  }
}

/** Sacrifices a share of every minion type (Blood Rite). */
function sacrifice(state: GameState, percent: number): void {
  if (hasLegendary(state, 'noSacrifice').length > 0) return;
  for (const entry of Object.values(state.army.minions)) {
    entry.owned -= Math.floor((entry.owned * percent) / 100);
  }
}

/** Casts a spell. Returns false if it isn't ready. */
export function castSpell(state: GameState, id: SpellId): boolean {
  if (!spellReady(state, id)) return false;
  const spell = SPELLS_BY_ID[id];
  const cost = spellCost(state, id);
  state.magic.essence -= cost;
  state.magic.cooldowns[id] = spellCooldown(state, id);
  state.stats.spellsCast += 1;

  const power = spellPower(state, id);
  const e = spell.effect;
  switch (e.kind) {
    case 'burst':
      dealDamage(state, armyDps(state, onBossFloor(state)).mul(e.seconds * power));
      break;
    case 'buff':
      applyBuff(state, e.buff);
      break;
    case 'sacrifice':
      sacrifice(state, e.percent);
      applyBuff(state, e.buff);
      break;
    case 'hpPercent': {
      const percent = Math.min(100, (onBossFloor(state) ? e.guardian : e.normal) * power);
      const amount = enemyMaxHp(state.descent.floor).mul(percent / 100);
      dealDamage(state, amount.lt(state.descent.enemyHp) ? amount : state.descent.enemyHp);
      break;
    }
    case 'income':
      addBones(state, totalIncome(state).mul(e.seconds * power));
      break;
    case 'drain':
      dealDamage(state, armyDps(state, onBossFloor(state)).mul(e.seconds * power));
      state.magic.essence = Math.min(essenceMax(state), state.magic.essence + e.essence * power);
      break;
  }
  gainSchoolXp(state, spell.school, spell.cost * researchProduct(state, 'schoolXp'));
  return true;
}

export function autoCastEnabled(state: GameState): boolean {
  return state.magic.autoCast && hasPact(state, 'autoCast');
}

/** Auto-cast priority: timed buffs first, then instant spells. Soul Drain last, to top up. */
export const CAST_ORDER: readonly SpellId[] = [
  'raiseLegion',
  'bloodRite',
  'plagueWind',
  'rot',
  'curseOfFrailty',
  'eclipse',
  'pestilence',
  'ossuaryRite',
  'hemorrhage',
  'crimsonTithe',
  'boneSpear',
  'soulDrain',
];

/** Seconds left on a buff, in case the UI wants it. */
export function buffSeconds(buff: SpellBuff): number {
  return BUFFS[buff].seconds;
}

/** Regenerates Essence, counts down cooldowns and auto-casts if enabled. */
export function updateMagic(state: GameState, dt: number): void {
  if (!magicUnlocked(state)) return;
  const m = state.magic;
  m.essence = Math.min(essenceMax(state), m.essence + essenceRegen(state) * dt);
  for (const id of Object.keys(m.cooldowns) as SpellId[]) {
    const left = (m.cooldowns[id] ?? 0) - dt;
    if (left > 0) m.cooldowns[id] = left;
    else delete m.cooldowns[id];
  }
  if (autoCastEnabled(state)) {
    for (const id of CAST_ORDER) castSpell(state, id);
  }
}
