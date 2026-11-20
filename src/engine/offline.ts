import type { Decimal } from './bignum';
import type { GameState } from './state';
import { BALANCE } from '../content/balance';
import { enterFloor, isUnbeatenBoss, offlineFloorCap } from '../systems/descent';
import { update } from '../systems/tick';

export interface OfflineSummary {
  /** How long the player was away. */
  awaySeconds: number;
  /** How much of that was simulated (after the cap). */
  simulatedSeconds: number;
  bonesGained: Decimal;
  kills: number;
  floorsGained: number;
}

export interface OfflineOptions {
  capSeconds?: number;
  /** Upper bound on simulation steps, so long absences stay fast. */
  maxSteps?: number;
  /** Smallest step size; short absences use fine steps for accuracy. */
  minStepSeconds?: number;
}

/**
 * Simulates time away in chunks. The army farms up to the deepest floor it has
 * already cleared, but never pushes new floors or fights unbeaten bosses while away.
 */
export function simulateOffline(state: GameState, awaySeconds: number, options: OfflineOptions = {}): OfflineSummary {
  const cap = options.capSeconds ?? BALANCE.BASE_OFFLINE_CAP_SECONDS;
  const maxSteps = options.maxSteps ?? 2000;
  const minStep = options.minStepSeconds ?? 0.05;

  const simulated = Math.max(0, Math.min(awaySeconds, cap));
  const bonesBefore = state.stats.lifetimeBones;
  const killsBefore = state.stats.totalKills;
  const floorBefore = state.descent.floor;

  if (simulated > 0) {
    // A boss fight left running can't be won unattended: fall back and farm instead.
    if (isUnbeatenBoss(state, state.descent.floor)) {
      state.descent.autoAdvance = false;
      enterFloor(state, state.descent.floor - 1);
    }
    const steps = Math.max(1, Math.min(maxSteps, Math.ceil(simulated / minStep)));
    const dt = simulated / steps;
    const floorCap = offlineFloorCap(state);
    for (let i = 0; i < steps; i++) update(state, dt, { offline: true, floorCap });
  }

  return {
    awaySeconds: Math.max(0, awaySeconds),
    simulatedSeconds: simulated,
    bonesGained: state.stats.lifetimeBones.sub(bonesBefore),
    kills: state.stats.totalKills - killsBefore,
    floorsGained: state.descent.floor - floorBefore,
  };
}
