import type { GameState } from '../engine/state';
import { armyDps } from './army';
import { dealDamage } from './descent';

export interface TickContext {
  /** True while simulating time the player was away. */
  offline?: boolean;
  /** Highest floor the army may reach this tick (see DamageOptions.floorCap). */
  floorCap?: number;
}

/** Advances the whole game by `dt` seconds. Pure logic: no DOM, no clock. */
export function update(state: GameState, dt: number, ctx: TickContext = {}): void {
  if (dt <= 0) return;
  if (!ctx.offline) state.meta.playTimeSeconds += dt;

  const dps = armyDps(state);
  if (dps.gt(0)) dealDamage(state, dps.mul(dt), { floorCap: ctx.floorCap });
}
