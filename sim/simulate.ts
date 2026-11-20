import { Decimal } from '../src/engine/bignum';
import { createInitialState, type GameState } from '../src/engine/state';
import { GRAVEWORKS, GRAVEWORKS_BY_ID } from '../src/content/graveworks';
import { MINIONS } from '../src/content/minions';
import { armyDps, buyMinion, ownedCount, purchaseCost } from '../src/systems/army';
import {
  buyGraveworks,
  cycleSeconds,
  graveworksOwned,
  graveworksPurchaseCost,
  graveworksRate,
  hireWarden,
  startCycle,
} from '../src/systems/crypt';
import { challengeBoss, enemyMaxHp } from '../src/systems/descent';
import { catchSoul } from '../src/systems/events';
import { armyIncome } from '../src/systems/income';
import { bossTimerSeconds } from '../src/systems/modifiers';
import { clickDamage, siphon } from '../src/systems/siphon';
import { availableUpgrades, buyUpgrade } from '../src/systems/upgrades';
import { update } from '../src/systems/tick';
import { nextFloat } from '../src/engine/rng';
import { PACT_NODES } from '../src/content/pact';
import { SPELLS } from '../src/content/spells';
import { equipBest } from '../src/systems/loot';
import { castSpell } from '../src/systems/magic';
import { buyPact, canBuyPact, canRebirth, rebirth } from '../src/systems/prestige';

export interface SimOptions {
  seconds: number;
  /** Simulated clicks per second (0 = fully idle). */
  clicksPerSecond: number;
  /** How often the player checks the Crypt to restart manual cycles, in seconds. */
  attentionSeconds: number;
  /** Chance the player catches each Wandering Soul. */
  soulCatchRate: number;
  /** Simulation step in seconds. */
  dt: number;
  /** How often the player makes purchase decisions, in seconds. */
  decideEvery: number;
  seed: number;
  /** Record a CSV sample every N simulated seconds. */
  sampleEvery: number;
  floorMilestones: readonly number[];
  /** Rebirth once the deepest floor hasn't improved for this long (0 = never). */
  rebirthAfterStall: number;
  /** Stop rebirthing after this many. */
  maxRebirths: number;
  /** Equip gear (for measuring how much loot contributes). */
  useGear: boolean;
  /** Cast spells manually (auto-cast still works after the Dark Pact node). */
  useSpells: boolean;
}

export const DEFAULT_SIM_OPTIONS: SimOptions = {
  seconds: 2 * 3600,
  clicksPerSecond: 5,
  attentionSeconds: 4,
  soulCatchRate: 0.8,
  dt: 0.25,
  decideEvery: 1,
  seed: 1,
  sampleEvery: 60,
  floorMilestones: [10, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90, 100],
  rebirthAfterStall: 0,
  maxRebirths: 3,
  useGear: true,
  useSpells: true,
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
  income: string;
  owned: Record<string, number>;
}

export interface SimResult {
  state: GameState;
  milestones: Milestone[];
  samples: SimSample[];
  bossFails: number;
}

/**
 * Income the simulated player expects: army income plus Crypt income, with manual
 * graveworks discounted by how often the player restarts them.
 */
export function estimatedIncome(state: GameState, attentionSeconds: number): Decimal {
  let total = armyIncome(state);
  for (const g of GRAVEWORKS) {
    if (graveworksOwned(state, g.id) <= 0) continue;
    const e = state.crypt.graveworks[g.id]!;
    const cycle = cycleSeconds(state, g.id);
    const efficiency = e.warden ? 1 : cycle / (cycle + attentionSeconds / 2);
    total = total.add(graveworksRate(state, g.id).mul(efficiency));
  }
  return total;
}

interface Candidate {
  label: string;
  cost: Decimal;
  gain: Decimal;
  buy: () => boolean;
}

/** Every purchase the player could make, with its estimated income gain. */
function candidates(state: GameState, attention: number): Candidate[] {
  const base = estimatedIncome(state, attention);
  const list: Candidate[] = [];
  const measure = (apply: () => void, revert: () => void): Decimal => {
    apply();
    const after = estimatedIncome(state, attention);
    revert();
    return after.sub(base);
  };

  for (const m of MINIONS) {
    const entry = state.army.minions[m.id]!;
    list.push({
      label: m.name,
      cost: purchaseCost(state, m.id, 1),
      gain: measure(
        () => entry.owned++,
        () => entry.owned--,
      ),
      buy: () => buyMinion(state, m.id, 1) > 0,
    });
  }

  if (state.unlocks.crypt) {
    for (const g of GRAVEWORKS) {
      const entry = state.crypt.graveworks[g.id]!;
      list.push({
        label: g.name,
        cost: graveworksPurchaseCost(state, g.id, 1),
        gain: measure(
          () => entry.owned++,
          () => entry.owned--,
        ),
        buy: () => buyGraveworks(state, g.id, 1) > 0,
      });
      if (state.unlocks.wardens && entry.owned > 0 && !entry.warden) {
        list.push({
          label: g.warden.name,
          cost: new Decimal(GRAVEWORKS_BY_ID[g.id]!.warden.cost),
          gain: measure(
            () => (entry.warden = true),
            () => (entry.warden = false),
          ),
          buy: () => hireWarden(state, g.id),
        });
      }
    }
  }

  for (const u of availableUpgrades(state)) {
    const purchased = state.upgrades.purchased;
    let gain = measure(
      () => purchased.push(u.id),
      () => purchased.pop(),
    );
    // Upgrades that don't raise income (boss timer, click power, soul rate) still matter:
    // value them as if they gave 3% more income.
    if (gain.lte(0)) gain = base.mul(0.03).add(0.01);
    list.push({ label: u.name, cost: new Decimal(u.cost), gain, buy: () => buyUpgrade(state, u.id) });
  }
  return list;
}

/**
 * Greedy strategy: pick the purchase with the shortest "wait + payback" time.
 * Buys it if affordable; otherwise saves for it. Returns labels of first purchases.
 */
export function makePurchases(state: GameState, attention: number, onBuy: (label: string) => void): void {
  for (let guard = 0; guard < 500; guard++) {
    const income = Decimal.max(estimatedIncome(state, attention), 0.1);
    let best: { c: Candidate; score: number } | null = null;
    for (const c of candidates(state, attention)) {
      if (c.gain.lte(0)) continue;
      const wait = Decimal.max(c.cost.sub(state.resources.bones), 0).div(income).toNumber();
      const payback = c.cost.div(c.gain).toNumber();
      const score = wait + payback;
      if (!best || score < best.score) best = { c, score };
    }
    if (!best || state.resources.bones.lt(best.c.cost)) return;
    if (!best.c.buy()) return;
    onBuy(best.c.label);
  }
}

export function runSimulation(partial: Partial<SimOptions> = {}): SimResult {
  const opts: SimOptions = { ...DEFAULT_SIM_OPTIONS, ...partial };
  const state = createInitialState(0, opts.seed);
  const milestones: Milestone[] = [];
  const samples: SimSample[] = [];
  const pendingFloors = [...opts.floorMilestones];
  const seen = new Set<string>();
  let clickDebt = 0;
  let nextSample = 0;
  let nextDecision = 0;
  let nextAttention = 0;
  let lastChallenge = 0;
  let soulDecided = false;
  let nextGear = 0;
  let bestSeen = 1;
  let bestSeenAt = 0;
  state.loot.autoSalvage = 'common';
  const run = () => state.prestige.rebirths + 1;

  const mark = (label: string, t: number) => {
    if (seen.has(label)) return;
    seen.add(label);
    milestones.push({ label, seconds: t });
  };

  const record = (t: number) => {
    samples.push({
      seconds: t,
      floor: state.descent.floor,
      bones: state.resources.bones.toString(),
      lifetimeBones: state.stats.lifetimeBones.toString(),
      dps: armyDps(state).toString(),
      income: estimatedIncome(state, opts.attentionSeconds).toString(),
      owned: Object.fromEntries([
        ...MINIONS.map((m) => [m.id, ownedCount(state, m.id)] as const),
        ...GRAVEWORKS.map((g) => [g.id, graveworksOwned(state, g.id)] as const),
      ]),
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

    if (t >= nextAttention) {
      for (const g of GRAVEWORKS) startCycle(state, g.id);
      nextAttention += opts.attentionSeconds;
    }

    // Souls: decide once per appearance whether the player notices it.
    if (state.events.soul) {
      if (!soulDecided) {
        soulDecided = true;
        if (nextFloat({ state: (opts.seed * 7919 + state.stats.soulsCaught * 31 + Math.floor(t)) >>> 0 }) < opts.soulCatchRate) {
          catchSoul(state);
          mark('First Wandering Soul caught', t);
        }
      }
    } else {
      soulDecided = false;
    }

    update(state, opts.dt);

    // After losing to a boss, challenge again once the army looks strong enough (or every 2 min).
    if (!state.descent.autoAdvance) {
      const next = state.descent.floor + 1;
      const burst = armyDps(state, true).add(clickDamage(state).mul(opts.clicksPerSecond));
      const ready = burst.mul(bossTimerSeconds(state) * 0.9).gte(enemyMaxHp(next));
      if (ready || t - lastChallenge > 120) {
        challengeBoss(state);
        lastChallenge = t;
      }
    }

    if (t >= nextDecision) {
      makePurchases(state, opts.attentionSeconds, (label) => {
        if (run() === 1) mark(`First ${label}`, t);
      });
      // An active player casts whatever is ready, buffs first.
      if (opts.useSpells) {
        for (const id of ['raiseLegion', 'ossuaryRite', 'boneSpear'] as const) {
          if (SPELLS.some((sp) => sp.id === id)) castSpell(state, id);
        }
      }
      nextDecision += opts.decideEvery;
    }

    if (opts.useGear && t >= nextGear) {
      equipBest(state);
      nextGear += 30;
    }

    while (pendingFloors.length > 0 && state.descent.maxFloor >= pendingFloors[0]!) {
      mark(`Run ${run()}: floor ${pendingFloors.shift()}`, t);
    }

    if (state.descent.maxFloor > bestSeen) {
      bestSeen = state.descent.maxFloor;
      bestSeenAt = t;
    }
    if (
      opts.rebirthAfterStall > 0 &&
      state.prestige.rebirths < opts.maxRebirths &&
      canRebirth(state) &&
      t - bestSeenAt >= opts.rebirthAfterStall
    ) {
      const depth = state.descent.maxFloor;
      const gained = rebirth(state, 0);
      mark(`Run ${run() - 1} ended at floor ${depth} (+${gained} shards)`, t);
      // Spend shards: cheapest available node first, repeatedly.
      for (let guard = 0; guard < 50; guard++) {
        const next = PACT_NODES.filter((n) => canBuyPact(state, n.id)).sort((a, b) => a.cost - b.cost)[0];
        if (!next || !buyPact(state, next.id)) break;
      }
      state.prestige.autoBuy = true;
      state.magic.autoCast = true;
      pendingFloors.splice(0, pendingFloors.length, ...opts.floorMilestones);
      bestSeen = state.descent.maxFloor;
      bestSeenAt = t;
    }
  }

  return { state, milestones, samples, bossFails: state.stats.bossesFailed };
}

export function samplesToCsv(samples: readonly SimSample[]): string {
  const ids = [...MINIONS.map((m) => m.id), ...GRAVEWORKS.map((g) => g.id)];
  const header = ['seconds', 'floor', 'bones', 'lifetimeBones', 'dps', 'income', ...ids].join(',');
  const rows = samples.map((s) =>
    [s.seconds.toFixed(0), s.floor, s.bones, s.lifetimeBones, s.dps, s.income, ...ids.map((id) => s.owned[id] ?? 0)].join(
      ',',
    ),
  );
  return [header, ...rows].join('\n') + '\n';
}

