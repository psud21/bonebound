import { Decimal } from '../engine/bignum';
import { bulkCost, maxAffordable } from '../engine/economy';
import type { BuyAmount, GameState, GraveworksState } from '../engine/state';
import { GRAVEWORKS, GRAVEWORKS_BY_ID, type GraveworksDef } from '../content/graveworks';
import {
  bonesMultiplier,
  cryptMultiplier,
  graveworksRevenueMultiplier,
  graveworksSpeedMultiplier,
} from './modifiers';
import { addBones, spendBones } from './resources';

function def(id: string): GraveworksDef {
  const g = GRAVEWORKS_BY_ID[id];
  if (!g) throw new Error(`Unknown graveworks: ${id}`);
  return g;
}

function entry(state: GameState, id: string): GraveworksState {
  return (state.crypt.graveworks[id] ??= { owned: 0, progress: 0, running: false, warden: false });
}

export function graveworksOwned(state: GameState, id: string): number {
  return state.crypt.graveworks[id]?.owned ?? 0;
}

export function graveworksPurchaseCount(state: GameState, id: string, amount: BuyAmount): number {
  if (amount !== 'max') return amount;
  const g = def(id);
  return maxAffordable(g.baseCost, g.costGrowth, graveworksOwned(state, id), state.resources.bones);
}

export function graveworksPurchaseCost(state: GameState, id: string, count: number): Decimal {
  const g = def(id);
  return bulkCost(g.baseCost, g.costGrowth, graveworksOwned(state, id), count);
}

export function buyGraveworks(state: GameState, id: string, amount: BuyAmount): number {
  const count = graveworksPurchaseCount(state, id, amount);
  if (count <= 0) return 0;
  if (!spendBones(state, graveworksPurchaseCost(state, id, count))) return 0;
  entry(state, id).owned += count;
  return count;
}

export function hireWarden(state: GameState, id: string): boolean {
  const e = entry(state, id);
  if (e.warden || e.owned <= 0) return false;
  if (!spendBones(state, new Decimal(def(id).warden.cost))) return false;
  e.warden = true;
  return true;
}

/** Starts one manual production cycle. */
export function startCycle(state: GameState, id: string): boolean {
  const e = entry(state, id);
  if (e.owned <= 0 || e.running || e.warden) return false;
  e.running = true;
  return true;
}

export function cycleSeconds(state: GameState, id: string): number {
  return def(id).cycleSeconds / graveworksSpeedMultiplier(state, id);
}

/** Bones produced by one completed cycle (all multipliers applied). */
export function revenuePerCycle(state: GameState, id: string): Decimal {
  const g = def(id);
  const warden = state.crypt.graveworks[id]?.warden === true;
  const mult = graveworksRevenueMultiplier(state, id, warden) * cryptMultiplier(state) * bonesMultiplier(state);
  return new Decimal(g.revenue).mul(graveworksOwned(state, id)).mul(mult);
}

/** Steady-state Bones per second of one graveworks when it runs continuously. */
export function graveworksRate(state: GameState, id: string): Decimal {
  return revenuePerCycle(state, id).div(cycleSeconds(state, id));
}

/** Advances all graveworks by dt seconds. Returns Bones produced. */
export function updateCrypt(state: GameState, dt: number): Decimal {
  let produced = new Decimal(0);
  for (const g of GRAVEWORKS) {
    const e = state.crypt.graveworks[g.id];
    if (!e || e.owned <= 0) continue;
    if (!e.warden && !e.running) continue;

    e.progress += dt / cycleSeconds(state, g.id);
    if (e.progress < 1) continue;

    let cycles: number;
    if (e.warden) {
      cycles = Math.floor(e.progress);
      e.progress -= cycles;
    } else {
      cycles = 1;
      e.progress = 0;
      e.running = false;
    }
    const amount = revenuePerCycle(state, g.id).mul(cycles);
    addBones(state, amount);
    produced = produced.add(amount);
  }
  return produced;
}

/** Bones per second the Crypt is producing right now (manual graveworks count only while running). */
export function cryptIncome(state: GameState): Decimal {
  let total = new Decimal(0);
  for (const g of GRAVEWORKS) {
    const e = state.crypt.graveworks[g.id];
    if (!e || e.owned <= 0 || (!e.warden && !e.running)) continue;
    total = total.add(graveworksRate(state, g.id));
  }
  return total;
}

export function graveworksVisible(state: GameState, id: string): boolean {
  return graveworksOwned(state, id) > 0 || state.stats.lifetimeBones.gte(def(id).baseCost * 0.4);
}
