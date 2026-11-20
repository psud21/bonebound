import type { GameState } from '../engine/state';
import { isBossFloor, layerForFloor, type LayerHazard } from '../content/layers';
import { buffActive } from './buffs';
import { covenEffects } from './covens';
import { hasLegendary } from './gear';
import { researchEffects } from './library';

/** How much of a hazard still applies (0 = none, 1 = full), after research, relics and covens. */
export function hazardFactor(state: GameState, hazard: LayerHazard): number {
  if (hasLegendary(state, 'ignoreHazard').some((e) => e.hazard === hazard)) return 0;
  if (hazard === 'regen' && covenEffects(state).noRegen) return 0;
  return researchEffects(state, 'hazard').reduce((m, e) => (e.hazard === hazard ? m * e.mult : m), 1);
}

/** Fraction of max HP the current enemy heals per second. */
export function regenRate(state: GameState): number {
  const floor = state.descent.floor;
  const mod = layerForFloor(floor).modifier;
  if (mod.kind !== 'regen' || buffActive(state, 'plagueWind')) return 0;
  const percent = isBossFloor(floor) ? mod.guardianPercent : mod.percent;
  return (percent / 100) * hazardFactor(state, 'regen');
}

/** Damage multiplier for one minion from the Ashen Wastes burn. */
export function burnMultiplier(state: GameState, burnImmune: boolean): number {
  const mod = layerForFloor(state.descent.floor).modifier;
  if (mod.kind !== 'burn' || burnImmune) return 1;
  return 1 - (mod.percent / 100) * hazardFactor(state, 'burn');
}

/** Army damage multiplier from the Weeping Glacier slow. */
export function slowMultiplier(state: GameState): number {
  const mod = layerForFloor(state.descent.floor).modifier;
  if (mod.kind !== 'slow') return 1;
  return 1 - (mod.percent / 100) * hazardFactor(state, 'slow');
}

/** Damage multiplier against consecrated guardians in the Cathedral Inverted. */
export function holyMultiplier(state: GameState, holyPierce: boolean): number {
  const floor = state.descent.floor;
  const mod = layerForFloor(floor).modifier;
  if (mod.kind !== 'holy' || holyPierce || !isBossFloor(floor)) return 1;
  return 1 - (1 - mod.guardianDamage) * hazardFactor(state, 'holy');
}

/** Damage multiplier for one minion on swarm floors (Bone Mages splash). */
export function swarmMultiplier(state: GameState, swarmMult: number | undefined): number {
  const mod = layerForFloor(state.descent.floor).modifier;
  return mod.kind === 'swarm' && swarmMult ? swarmMult : 1;
}

/** Guardian timer multiplier from the Throat of the Void. */
export function voidTimerMultiplier(state: GameState): number {
  const mod = layerForFloor(state.descent.floor).modifier;
  if (mod.kind !== 'void') return 1;
  return 1 - (1 - mod.timerMult) * hazardFactor(state, 'void');
}
