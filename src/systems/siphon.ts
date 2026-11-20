import { Decimal } from '../engine/bignum';
import type { GameState } from '../engine/state';
import { BALANCE } from '../content/balance';
import { dealDamage, type DamageResult } from './descent';

export function clickDamage(_state: GameState): Decimal {
  // M1+: upgrades add a percentage of army DPS here.
  return new Decimal(BALANCE.BASE_CLICK_DAMAGE);
}

/** The player clicks the current enemy. */
export function siphon(state: GameState): DamageResult {
  state.stats.totalClicks += 1;
  return dealDamage(state, clickDamage(state));
}
