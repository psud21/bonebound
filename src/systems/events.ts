import { Decimal } from '../engine/bignum';
import { nextFloat, weightedPick } from '../engine/rng';
import type { GameState } from '../engine/state';
import { BALANCE } from '../content/balance';
import {
  BONE_SHOWER_MINIMUM,
  BONE_SHOWER_SECONDS,
  BUFFS,
  GRAVE_RUSH_FLOORS,
  SOUL_REWARDS,
  type BuffId,
  type SoulReward,
} from '../content/events';
import { skipFloors } from './descent';
import { totalIncome } from './income';
import { addLog } from './log';
import { soulBoosted, soulFrequencyMultiplier } from './modifiers';
import { addBones } from './resources';

export function soulsUnlocked(state: GameState): boolean {
  return state.unlocks.souls === true;
}

function rollSoulDelay(state: GameState): number {
  const span = BALANCE.SOUL_MAX_DELAY - BALANCE.SOUL_MIN_DELAY;
  const delay = BALANCE.SOUL_MIN_DELAY + nextFloat(state.rng) * span;
  return delay / soulFrequencyMultiplier(state);
}

export function spawnSoul(state: GameState): void {
  state.events.soul = {
    timeLeft: BALANCE.SOUL_LIFETIME,
    // Keep away from the edges so it's always reachable.
    x: 8 + nextFloat(state.rng) * 84,
    y: 15 + nextFloat(state.rng) * 70,
  };
}

/** Ticks buffs down; spawns and expires Wandering Souls (only while playing, not offline). */
export function updateEvents(state: GameState, dt: number, offline: boolean): void {
  const ev = state.events;
  for (const id of Object.keys(ev.buffs) as BuffId[]) {
    const left = (ev.buffs[id] ?? 0) - dt;
    if (left > 0) ev.buffs[id] = left;
    else delete ev.buffs[id];
  }

  if (offline || !soulsUnlocked(state)) return;

  if (ev.soul) {
    ev.soul.timeLeft -= dt;
    if (ev.soul.timeLeft <= 0) {
      ev.soul = null;
      ev.soulCooldown = rollSoulDelay(state);
    }
    return;
  }

  ev.soulCooldown -= dt;
  if (ev.soulCooldown <= 0) spawnSoul(state);
}

export function applyBuff(state: GameState, id: BuffId, fromSoul = false): void {
  const current = state.events.buffs[id] ?? 0;
  const seconds = BUFFS[id].seconds * (fromSoul && soulBoosted(state) ? 2 : 1);
  state.events.buffs[id] = Math.max(current, seconds);
}

export interface SoulOutcome {
  reward: SoulReward;
  message: string;
}

/** The player clicked the Wandering Soul. */
export function catchSoul(state: GameState, forced?: SoulReward): SoulOutcome | null {
  if (!state.events.soul) return null;
  state.events.soul = null;
  state.events.soulCooldown = rollSoulDelay(state);
  state.stats.soulsCaught += 1;

  const reward = forced ?? weightedPick(state.rng, SOUL_REWARDS);
  let message: string;
  switch (reward) {
    case 'soulFrenzy':
    case 'bloodMoon': {
      applyBuff(state, reward, true);
      const b = BUFFS[reward];
      const seconds = Math.round(state.events.buffs[reward] ?? b.seconds);
      message = `${b.name}! ${b.description.replace(/\.$/, '')} for ${seconds} seconds.`;
      break;
    }
    case 'graveRush': {
      const skipped = skipFloors(state, GRAVE_RUSH_FLOORS);
      message =
        skipped > 0
          ? `Grave Rush! Your army surges down ${skipped} floor${skipped === 1 ? '' : 's'}.`
          : 'Grave Rush! But a guardian blocks the way. The soul scatters into Bones instead.';
      if (skipped === 0) addBones(state, showerAmount(state));
      break;
    }
    case 'boneShower': {
      addBones(state, showerAmount(state));
      message = 'Bone Shower! The soul bursts into a rain of Bones.';
      break;
    }
  }
  addLog(state, 'event', message);
  return { reward, message };
}

function showerAmount(state: GameState): Decimal {
  return Decimal.max(totalIncome(state).mul(BONE_SHOWER_SECONDS), BONE_SHOWER_MINIMUM);
}
