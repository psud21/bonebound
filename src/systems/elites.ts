import type { GameState } from '../engine/state';
import { CORPSES, ELITES, ELITES_BY_ID, type EliteDef, type EliteEffect } from '../content/elites';
import { hasLegendary } from './gear';
import { researchProduct } from './library';

export function corpsesUnlocked(state: GameState): boolean {
  return state.unlocks.corpses === true || state.descent.maxFloor >= CORPSES.UNLOCK_FLOOR;
}

export function corpseMultiplier(state: GameState): number {
  const ghouls = state.army.minions.ghoul?.owned ?? 0;
  const legendary = hasLegendary(state, 'corpseMult').reduce((m, e) => m * e.mult, 1);
  return (1 + ghouls * CORPSES.PER_GHOUL) * legendary * researchProduct(state, 'corpses');
}

/** Corpses for a batch of kills. Returns the amount gained. */
export function gainCorpses(state: GameState, kills: number, guardian: boolean): number {
  if (!corpsesUnlocked(state) || kills <= 0) return 0;
  const base = kills * (guardian ? CORPSES.PER_GUARDIAN : CORPSES.PER_KILL);
  const amount = base * corpseMultiplier(state);
  state.resources.corpses += amount;
  state.stats.corpsesEarned += amount;
  return amount;
}

export function eliteLevel(state: GameState, id: string): number {
  return state.army.elites[id] ?? 0;
}

export function totalEliteLevels(state: GameState): number {
  return Object.values(state.army.elites).reduce((s, n) => s + n, 0);
}

export function eliteUnlocked(state: GameState, id: string): boolean {
  const def = ELITES_BY_ID[id];
  return !!def && corpsesUnlocked(state) && state.descent.maxFloor >= def.unlockFloor;
}

export function eliteCost(state: GameState, id: string): number {
  const def = ELITES_BY_ID[id]!;
  return Math.ceil(def.baseCost * def.costGrowth ** eliteLevel(state, id) * researchProduct(state, 'eliteCost'));
}

export function canRaiseElite(state: GameState, id: string): boolean {
  return eliteUnlocked(state, id) && state.resources.corpses >= eliteCost(state, id);
}

/** Spends Corpses to add one level to an Elite. */
export function raiseElite(state: GameState, id: string): boolean {
  if (!canRaiseElite(state, id)) return false;
  state.resources.corpses -= eliteCost(state, id);
  state.army.elites[id] = eliteLevel(state, id) + 1;
  return true;
}

function effectOf<K extends EliteEffect['kind']>(kind: K): { def: EliteDef; effect: Extract<EliteEffect, { kind: K }> }[] {
  return ELITES.filter((d) => d.effect.kind === kind).map((d) => ({ def: d, effect: d.effect as Extract<EliteEffect, { kind: K }> }));
}

/** Each level multiplies by (1 + perLevel): exponential, like the cost. */
export function eliteArmyDamage(state: GameState): number {
  return effectOf('armyDamage').reduce((m, { def, effect }) => m * (1 + effect.perLevel) ** eliteLevel(state, def.id), 1);
}

export function eliteBones(state: GameState): number {
  return effectOf('bones').reduce((m, { def, effect }) => m * (1 + effect.perLevel) ** eliteLevel(state, def.id), 1);
}

export function eliteEssenceRegen(state: GameState): number {
  return effectOf('essence').reduce((m, { def, effect }) => m * (1 + effect.regenPerLevel * eliteLevel(state, def.id)), 1);
}

export function eliteSpellPower(state: GameState): number {
  return effectOf('essence').reduce((m, { def, effect }) => m * (1 + effect.powerPerLevel * eliteLevel(state, def.id)), 1);
}

export function eliteGuardianDamage(state: GameState): number {
  return effectOf('guardian').reduce((m, { def, effect }) => m * (1 + effect.damagePerLevel) ** eliteLevel(state, def.id), 1);
}

export function eliteGuardianTimer(state: GameState): number {
  return effectOf('guardian').reduce(
    (s, { def, effect }) => s + Math.min(effect.maxTimer, effect.timerPerLevel * eliteLevel(state, def.id)),
    0,
  );
}

/** Text describing an Elite's current total effect. */
export function eliteEffectText(state: GameState, id: string): string {
  const def = ELITES_BY_ID[id]!;
  const level = eliteLevel(state, id);
  const e = def.effect;
  switch (e.kind) {
    case 'armyDamage':
    case 'bones':
      return def.effectText.replace('{v}', ((1 + e.perLevel) ** level).toFixed(2));
    case 'essence':
      return def.effectText
        .replace('{v}', Math.round(e.regenPerLevel * level * 100).toString())
        .replace('{w}', Math.round(e.powerPerLevel * level * 100).toString());
    case 'guardian':
      return def.effectText
        .replace('{v}', ((1 + e.damagePerLevel) ** level).toFixed(2))
        .replace('{w}', Math.min(e.maxTimer, e.timerPerLevel * level).toFixed(1));
  }
}
