import type { Decimal } from '../engine/bignum';
import type { GameState } from '../engine/state';
import { armyDps } from './army';
import { cryptIncome } from './crypt';
import { bonesPerHp } from './descent';
import { bonesMultiplier } from './modifiers';

/** Bones per second from the army killing enemies (kills pay out in proportion to HP). */
export function armyIncome(state: GameState): Decimal {
  return armyDps(state).mul(bonesPerHp(state.descent.floor) * bonesMultiplier(state));
}

/** Approximate total Bones per second right now. */
export function totalIncome(state: GameState): Decimal {
  return armyIncome(state).add(cryptIncome(state));
}
