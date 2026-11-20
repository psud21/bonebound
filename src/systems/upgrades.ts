import { Decimal } from '../engine/bignum';
import type { GameState } from '../engine/state';
import { UPGRADES, UPGRADES_BY_ID, type UpgradeDef } from '../content/upgrades';
import { conditionMet } from './conditions';
import { spendBones } from './resources';

export function isPurchased(state: GameState, id: string): boolean {
  return state.upgrades.purchased.includes(id);
}

/** Upgrades whose unlock condition is met and that aren't bought yet, cheapest first. */
export function availableUpgrades(state: GameState): UpgradeDef[] {
  return UPGRADES.filter((u) => !isPurchased(state, u.id) && conditionMet(state, u.unlock)).sort(
    (a, b) => a.cost - b.cost,
  );
}

export function buyUpgrade(state: GameState, id: string): boolean {
  const def = UPGRADES_BY_ID[id];
  if (!def || isPurchased(state, id) || !conditionMet(state, def.unlock)) return false;
  if (!spendBones(state, new Decimal(def.cost))) return false;
  state.upgrades.purchased.push(id);
  return true;
}
