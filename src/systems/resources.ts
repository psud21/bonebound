import type { Decimal } from '../engine/bignum';
import type { GameState } from '../engine/state';

export function gainBones(state: GameState, amount: Decimal): void {
  if (amount.lte(0)) return;
  state.resources.bones = state.resources.bones.add(amount);
  state.stats.lifetimeBones = state.stats.lifetimeBones.add(amount);
}

/** Spends Bones if the player has enough. Returns whether it succeeded. */
export function spendBones(state: GameState, amount: Decimal): boolean {
  if (state.resources.bones.lt(amount)) return false;
  state.resources.bones = state.resources.bones.sub(amount);
  return true;
}
