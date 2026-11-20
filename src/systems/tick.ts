import type { GameState } from '../engine/state';
import { armyDps } from './army';
import { updateCrypt } from './crypt';
import { dealDamage, onBossFloor, updateBossTimer, updateRegen } from './descent';
import { checkFeats } from './feats';
import { updateLibrary } from './library';
import { updateEvents } from './events';
import { updateMagic } from './magic';
import { autoBuy } from './prestige';
import { checkUnlocks } from './unlocks';

export interface TickContext {
  /** True while simulating time the player was away. */
  offline?: boolean;
  /** Highest floor the army may reach this tick (see DamageOptions.floorCap). */
  floorCap?: number;
}

/** Advances the whole game by `dt` seconds. Pure logic: no DOM, no clock. */
export function update(state: GameState, dt: number, ctx: TickContext = {}): void {
  if (dt <= 0) return;
  const offline = ctx.offline === true;
  if (!offline) state.meta.playTimeSeconds += dt;

  updateCrypt(state, dt);
  updateLibrary(state, dt);
  updateRegen(state, dt);

  const dps = armyDps(state, onBossFloor(state));
  if (dps.gt(0)) dealDamage(state, dps.mul(dt), { floorCap: ctx.floorCap });
  if (!offline) updateBossTimer(state, dt);

  updateEvents(state, dt, offline);
  updateMagic(state, dt);
  autoBuy(state);
  checkUnlocks(state);
  checkFeats(state);
}
