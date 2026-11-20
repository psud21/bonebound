import { Decimal } from '../engine/bignum';
import type { GameState } from '../engine/state';
import { BALANCE } from '../content/balance';
import { armyDps } from './army';
import { dealDamage, onBossFloor, type DamageResult } from './descent';
import { allDamageMultiplier, clickDpsPercent, clickFlatBonus } from './modifiers';

export function clickDamage(state: GameState): Decimal {
  const flat = (BALANCE.BASE_CLICK_DAMAGE + clickFlatBonus(state)) * allDamageMultiplier(state);
  const percent = clickDpsPercent(state);
  const fromDps = percent > 0 ? armyDps(state, onBossFloor(state)).mul(percent / 100) : new Decimal(0);
  return fromDps.add(flat);
}

export interface SiphonResult extends DamageResult {
  damage: Decimal;
}

/** The player clicks the current enemy. */
export function siphon(state: GameState): SiphonResult {
  state.stats.totalClicks += 1;
  const damage = clickDamage(state);
  return { ...dealDamage(state, damage), damage };
}
