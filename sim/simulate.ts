import { createInitialState, type GameState } from '../src/engine/state';
import { MINIONS } from '../src/content/minions';
import { armyDps, buyMinion, ownedCount, purchaseCost } from '../src/systems/army';
import { siphon } from '../src/systems/siphon';
import { update } from '../src/systems/tick';

export interface SimOptions {
  seconds: number;
  /** Simulated clicks per second (0 = fully idle). */
  clicksPerSecond: number;
  /** Simulation step in seconds. */
  dt: number;
  seed: number;
  /** Record a CSV sample every N simulated seconds. */
  sampleEvery: number;
  floorMilestones: readonly number[];
}

export const DEFAULT_SIM_OPTIONS: SimOptions = {
  seconds: 2 * 3600,
  clicksPerSecond: 5,
  dt: 0.25,
  seed: 1,
  sampleEvery: 60,
  floorMilestones: [5, 10, 25, 50, 75, 100, 150, 200],
};

export interface Milestone {
  label: string;
  seconds: number;
}

export interface SimSample {
  seconds: number;
  floor: number;
  bones: string;
  lifetimeBones: string;
  dps: string;
  owned: Record<string, number>;
}

export interface SimResult {
  state: GameState;
  milestones: Milestone[];
  samples: SimSample[];
}

/** Greedy strategy: buy the minion with the best DPS per Bone whenever affordable. */
export function bestPurchase(state: GameState): string | null {
  let best: { id: string; value: number } | null = null;
  for (const m of MINIONS) {
    const value = m.baseDps / purchaseCost(state, m.id, 1).toNumber();
    if (!best || value > best.value) best = { id: m.id, value };
  }
  return best?.id ?? null;
}

export function runSimulation(partial: Partial<SimOptions> = {}): SimResult {
  const opts: SimOptions = { ...DEFAULT_SIM_OPTIONS, ...partial };
  const state = createInitialState(0, opts.seed);
  const milestones: Milestone[] = [];
  const samples: SimSample[] = [];
  const pendingFloors = [...opts.floorMilestones];
  const firstBuys = new Set<string>();
  let clickDebt = 0;
  let nextSample = 0;

  const record = (t: number) => {
    samples.push({
      seconds: t,
      floor: state.descent.floor,
      bones: state.resources.bones.toString(),
      lifetimeBones: state.stats.lifetimeBones.toString(),
      dps: armyDps(state).toString(),
      owned: Object.fromEntries(MINIONS.map((m) => [m.id, ownedCount(state, m.id)])),
    });
  };

  for (let t = 0; t <= opts.seconds; t += opts.dt) {
    if (t >= nextSample) {
      record(t);
      nextSample += opts.sampleEvery;
    }

    clickDebt += opts.clicksPerSecond * opts.dt;
    while (clickDebt >= 1) {
      siphon(state);
      clickDebt -= 1;
    }
    update(state, opts.dt);

    // Buy as many best-value units as we can afford this step.
    for (let guard = 0; guard < 1000; guard++) {
      const id = bestPurchase(state);
      if (!id || buyMinion(state, id, 1) === 0) break;
      if (!firstBuys.has(id)) {
        firstBuys.add(id);
        const name = MINIONS.find((m) => m.id === id)?.name ?? id;
        milestones.push({ label: `First ${name}`, seconds: t });
      }
    }

    while (pendingFloors.length > 0 && state.descent.maxFloor >= pendingFloors[0]!) {
      milestones.push({ label: `Floor ${pendingFloors.shift()}`, seconds: t });
    }
  }

  return { state, milestones, samples };
}

export function samplesToCsv(samples: readonly SimSample[]): string {
  const ids = MINIONS.map((m) => m.id);
  const header = ['seconds', 'floor', 'bones', 'lifetimeBones', 'dps', ...ids].join(',');
  const rows = samples.map((s) =>
    [s.seconds.toFixed(0), s.floor, s.bones, s.lifetimeBones, s.dps, ...ids.map((id) => s.owned[id] ?? 0)].join(','),
  );
  return [header, ...rows].join('\n') + '\n';
}
