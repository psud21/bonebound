import { Decimal } from '../engine/bignum';
import type { GameState } from '../engine/state';
import { BALANCE } from '../content/balance';
import { armyDps } from './army';
import { dealDamage, onBossFloor, type DamageResult } from './descent';
import { chance } from '../engine/rng';
import { hasLegendary } from './gear';
import { allDamageMultiplier, clickDpsPercent, clickFlatBonus, clickMultiplier } from './modifiers';

export function clickDamage(state: GameState): Decimal {
  const flat = (BALANCE.BASE_CLICK_DAMAGE + clickFlatBonus(state)) * allDamageMultiplier(state);
  const percent = clickDpsPercent(state);
  const fromDps = percent > 0 ? armyDps(state, onBossFloor(state)).mul(percent / 100) : new Decimal(0);
  return fromDps.add(flat).mul(clickMultiplier(state));
}

export interface SiphonResult extends DamageResult {
  damage: Decimal;
  crit: boolean;
}

/** The player clicks the current enemy. */
export function siphon(state: GameState): SiphonResult {
  state.stats.totalClicks += 1;
  let damage = clickDamage(state);
  let crit = false;
  for (const e of hasLegendary(state, 'clickCrit')) {
    if (chance(state.rng, e.chance)) {
      damage = damage.mul(e.mult);
      crit = true;
    }
  }
  return { ...dealDamage(state, damage), damage, crit };
}
