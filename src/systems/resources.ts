import type { Decimal } from '../engine/bignum';
import type { GameState } from '../engine/state';
import { bonesMultiplier } from './modifiers';

/** Adds Bones exactly as given (multipliers already applied by the caller). */
export function addBones(state: GameState, amount: Decimal): void {
  if (amount.lte(0)) return;
  state.resources.bones = state.resources.bones.add(amount);
  state.stats.lifetimeBones = state.stats.lifetimeBones.add(amount);
}

/** Adds Bones after applying the global Bones multiplier. Returns the amount gained. */
export function gainBones(state: GameState, base: Decimal): Decimal {
  const amount = base.mul(bonesMultiplier(state));
  addBones(state, amount);
  return amount;
}

/** Spends Bones if the player has enough. Returns whether it succeeded. */
export function spendBones(state: GameState, amount: Decimal): boolean {
  if (state.resources.bones.lt(amount)) return false;
  state.resources.bones = state.resources.bones.sub(amount);
  return true;
}
