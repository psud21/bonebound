import type { GameState } from '../engine/state';
import { ESSENCE, SPELLS, SPELLS_BY_ID, schoolPower, schoolXpForLevel, type SchoolId, type SpellId } from '../content/spells';
import { armyDps } from './army';
import { dealDamage, onBossFloor } from './descent';
import { applyBuff } from './events';
import { gearStat } from './gear';
import { addLog } from './log';
import { hasPact, pactEffects } from './prestige';

export function magicUnlocked(state: GameState): boolean {
  return state.unlocks.essence === true;
}

export function essenceMax(state: GameState): number {
  return ESSENCE.BASE_MAX + pactEffects(state, 'essence').reduce((s, e) => s + e.maxBonus, 0);
}

export function essenceRegen(state: GameState): number {
  const pact = pactEffects(state, 'essence').reduce((m, e) => m * e.regenMult, 1);
  return ESSENCE.BASE_REGEN * (1 + gearStat(state, 'essenceRegen') / 100) * pact;
}

export function schoolLevel(state: GameState, school: SchoolId): number {
  return state.magic.schools[school]?.level ?? 0;
}

export function spellPower(state: GameState, id: SpellId): number {
  return schoolPower(schoolLevel(state, SPELLS_BY_ID[id].school));
}

export function spellKnown(state: GameState, id: SpellId): boolean {
  return schoolLevel(state, SPELLS_BY_ID[id].school) >= SPELLS_BY_ID[id].unlockLevel;
}

export function spellReady(state: GameState, id: SpellId): boolean {
  return (
    magicUnlocked(state) &&
    spellKnown(state, id) &&
    (state.magic.cooldowns[id] ?? 0) <= 0 &&
    state.magic.essence >= SPELLS_BY_ID[id].cost
  );
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
      `School of Bone reached level ${s.level}.` + (learned.length ? ` You learned ${learned.map((l) => l.name).join(', ')}.` : ''),
    );
  }
}

/** Casts a spell. Returns false if it isn't ready. */
export function castSpell(state: GameState, id: SpellId): boolean {
  if (!spellReady(state, id)) return false;
  const spell = SPELLS_BY_ID[id];
  state.magic.essence -= spell.cost;
  state.magic.cooldowns[id] = spell.cooldown;
  state.stats.spellsCast += 1;

  const power = spellPower(state, id);
  if (spell.effect.kind === 'burst') {
    dealDamage(state, armyDps(state, onBossFloor(state)).mul(spell.effect.seconds * power));
  } else {
    applyBuff(state, spell.effect.buff);
  }
  gainSchoolXp(state, spell.school, spell.cost);
  return true;
}

/** Raise Legion's damage multiplier, which grows with School of Bone level. */
export function raiseLegionMultiplier(state: GameState): number {
  return 1 + 0.5 * spellPower(state, 'raiseLegion');
}

export function autoCastEnabled(state: GameState): boolean {
  return state.magic.autoCast && hasPact(state, 'autoCast');
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
    // Buffs first, then spend leftovers on Bone Spear.
    for (const id of ['raiseLegion', 'ossuaryRite', 'boneSpear'] as SpellId[]) castSpell(state, id);
  }
}
