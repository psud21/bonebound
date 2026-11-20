import { Decimal } from '../engine/bignum';
import { bulkCost, maxAffordable } from '../engine/economy';
import type { BuyAmount, GameState } from '../engine/state';
import { MINIONS, MINIONS_BY_ID, type MinionDef } from '../content/minions';
import { bossDamageMultiplier, minionMultiplier, normalDamageMultiplier } from './modifiers';
import { researchProduct } from './library';
import { curseEffects } from './curses';
import { holyMultiplier } from './hazards';
import { spendBones } from './resources';

function def(id: string): MinionDef {
  const m = MINIONS_BY_ID[id];
  if (!m) throw new Error(`Unknown minion: ${id}`);
  return m;
}

export function ownedCount(state: GameState, id: string): number {
  return state.army.minions[id]?.owned ?? 0;
}

/** Price of a minion's first unit after research discounts. */
function baseCost(state: GameState, id: string): number {
  return (
    def(id).baseCost * researchProduct(state, 'minionCost') * curseEffects(state, 'minionCost').reduce((m, e) => m * e.mult, 1)
  );
}

/** A minion that needs a story event (the Dracolich) can't be raised before it. */
export function minionAvailable(state: GameState, id: string): boolean {
  const need = def(id).requiresFloor;
  return need === undefined || Math.max(state.prestige.bestFloor, state.descent.maxFloor) >= need;
}

/** How many units a purchase would buy. "max" depends on current Bones; fixed amounts don't. */
export function purchaseCount(state: GameState, id: string, amount: BuyAmount): number {
  if (amount !== 'max') return amount;
  return maxAffordable(baseCost(state, id), def(id).costGrowth, ownedCount(state, id), state.resources.bones);
}

export function purchaseCost(state: GameState, id: string, count: number): Decimal {
  return bulkCost(baseCost(state, id), def(id).costGrowth, ownedCount(state, id), count);
}

/** Buys minions. Returns how many were bought (0 if the full amount isn't affordable). */
export function buyMinion(state: GameState, id: string, amount: BuyAmount): number {
  if (!minionAvailable(state, id)) return 0;
  const count = purchaseCount(state, id, amount);
  if (count <= 0) return 0;
  if (!spendBones(state, purchaseCost(state, id, count))) return 0;
  const entry = (state.army.minions[id] ??= { owned: 0 });
  entry.owned += count;
  return count;
}

/** Damage per second of one unit with all multipliers. */
export function unitDps(state: GameState, id: string, vsBoss = false): Decimal {
  const m = def(id);
  const boss = vsBoss
    ? (m.bossDamageMult ?? 1) * bossDamageMultiplier(state) * holyMultiplier(state, m.holyPierce === true)
    : normalDamageMultiplier(state);
  return new Decimal(m.baseDps).mul(minionMultiplier(state, id) * boss);
}

export function minionDps(state: GameState, id: string, vsBoss = false): Decimal {
  return unitDps(state, id, vsBoss).mul(ownedCount(state, id));
}

export function armyDps(state: GameState, vsBoss = false): Decimal {
  let total = new Decimal(0);
  for (const m of MINIONS) total = total.add(minionDps(state, m.id, vsBoss));
  return total;
}

/** A minion is shown once the player has earned a fraction of its price, or owns one. */
export function minionVisible(state: GameState, id: string): boolean {
  if (MINIONS[0]?.id === id) return true; // the first minion is always on offer
  if (!minionAvailable(state, id)) return false;
  return ownedCount(state, id) > 0 || state.stats.lifetimeBones.gte(def(id).baseCost * 0.4);
}
