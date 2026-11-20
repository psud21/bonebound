import { Decimal } from '../engine/bignum';
import { createInitialState, type GameState } from '../engine/state';
import { BALANCE } from '../content/balance';
import { MINIONS } from '../content/minions';
import { PACT_BY_ID, PRESTIGE, shardsForFloor, type PactEffect } from '../content/pact';
import { buyMinion, minionVisible, purchaseCost, unitDps } from './army';
import { enterFloor } from './descent';
import { addLog } from './log';
import { researchEffects, researchProduct } from './library';
import { LICH_POWERS_BY_ID } from '../content/endgame';
import { curseShardMultiplier } from './curses';
import { canAscend, lichEffects, pendingDread } from './lichdom';
import { closeRift } from './rifts';

/** Dark Pact nodes granted for free by Lich powers. */
function freePact(state: GameState): string[] {
  const out: string[] = [];
  for (const id of state.lich.powers) {
    const e = LICH_POWERS_BY_ID[id]?.effect;
    if (e?.kind === 'freePact') out.push(...e.ids);
  }
  return out;
}

/** Every Dark Pact node in effect: bought ones plus those a Lich power grants. */
export function ownedPact(state: GameState): string[] {
  const free = freePact(state);
  return free.length === 0 ? state.prestige.pact : [...new Set([...state.prestige.pact, ...free])];
}

export function hasPact(state: GameState, id: string): boolean {
  return ownedPact(state).includes(id);
}

export function pactEffects<K extends PactEffect['kind']>(state: GameState, kind: K): Extract<PactEffect, { kind: K }>[] {
  const out: Extract<PactEffect, { kind: K }>[] = [];
  for (const id of ownedPact(state)) {
    const e = PACT_BY_ID[id]?.effect;
    if (e && e.kind === kind) out.push(e as Extract<PactEffect, { kind: K }>);
  }
  return out;
}

/** Army damage multiplier from all Soul Shards ever earned. */
export function shardMultiplier(state: GameState): number {
  const perShard =
    PRESTIGE.SHARD_POWER_PERCENT +
    pactEffects(state, 'shardPower').reduce((s, e) => s + e.percent, 0) +
    lichEffects(state, 'shardPower').reduce((s, e) => s + e.percent, 0);
  return 1 + (perShard / 100) * state.prestige.shardsEarned;
}

/** Multiplier on Soul Shards gained from Rebirth. */
export function shardGainMultiplier(state: GameState): number {
  return (
    pactEffects(state, 'shardGain').reduce((m, e) => m * e.mult, 1) *
    researchProduct(state, 'shards') *
    lichEffects(state, 'shardGain').reduce((m, e) => m * e.mult, 1) *
    curseShardMultiplier(state)
  );
}

export function pendingShards(state: GameState): number {
  return Math.floor(shardsForFloor(state.descent.maxFloor) * shardGainMultiplier(state));
}

export function canRebirth(state: GameState): boolean {
  return pendingShards(state) > 0;
}

export function phylacteryVisible(state: GameState): boolean {
  return state.prestige.rebirths > 0 || state.descent.maxFloor >= PRESTIGE.MIN_FLOOR - 15;
}

export function canBuyPact(state: GameState, id: string): boolean {
  const node = PACT_BY_ID[id];
  if (!node || hasPact(state, id)) return false;
  return node.requires.every((r) => hasPact(state, r)) && state.prestige.shards >= node.cost;
}

export function buyPact(state: GameState, id: string): boolean {
  if (!canBuyPact(state, id)) return false;
  state.prestige.shards -= PACT_BY_ID[id]!.cost;
  state.prestige.pact.push(id);
  return true;
}

export function offlineCapSeconds(state: GameState): number {
  return (
    BALANCE.BASE_OFFLINE_CAP_SECONDS +
    pactEffects(state, 'offlineCap').reduce((s, e) => s + e.seconds, 0) +
    researchEffects(state, 'offlineCap').reduce((s, e) => s + e.seconds, 0)
  );
}

/** Applies Dark Pact head starts to a fresh run. */
export function applyRunStart(state: GameState): void {
  for (const e of pactEffects(state, 'startBones')) {
    state.resources.bones = state.resources.bones.add(e.amount);
  }
  for (const e of pactEffects(state, 'startMinions')) {
    for (const [id, count] of Object.entries(e.minions)) {
      const entry = (state.army.minions[id] ??= { owned: 0 });
      entry.owned = Math.max(entry.owned, count);
    }
  }
  for (const e of pactEffects(state, 'startGraveworks')) {
    for (const [id, count] of Object.entries(e.graveworks)) {
      const entry = state.crypt.graveworks[id];
      if (entry) entry.owned = Math.max(entry.owned, count);
    }
  }
  for (const e of pactEffects(state, 'startCorpses')) state.resources.corpses += e.amount;
  const startFloor = Math.max(
    1,
    ...pactEffects(state, 'startFloor').map((e) => e.floor),
    ...lichEffects(state, 'startFloor').map((e) => e.floor),
  );
  if (startFloor > 1) enterFloor(state, startFloor);
}

/**
 * Phylactery Rebirth: grants Soul Shards for this run's depth and starts a new run.
 * Keeps gear, Bone Dust, school levels, shards, the Dark Pact, unlocks, the Chronicle,
 * lifetime stats and settings. Returns the shards gained (0 if not allowed).
 */
export function rebirth(state: GameState, now: number = Date.now()): number {
  const gained = pendingShards(state);
  if (gained <= 0) return 0;
  const depth = state.descent.maxFloor;
  resetRun(state, now);

  const p = state.prestige;
  p.shards += gained;
  p.shardsEarned += gained;
  p.rebirths += 1;
  p.bestFloor = Math.max(p.bestFloor, depth);
  p.runStartedAt = state.meta.playTimeSeconds;

  applyRunStart(state);
  addLog(
    state,
    'story',
    `Your body crumbles at floor ${depth}. Your soul does not. You rise again from the phylactery, ${gained} Soul Shards stronger.`,
  );
  return gained;
}

/**
 * Lichdom Ascension: the second death. Grants Dread for every Soul Shard earned since the
 * last one, then resets Soul Shards and the Dark Pact as well as the run. Keeps relics,
 * gems, school levels, research, feats, Rift progress and Lich powers. Returns Dread gained.
 */
export function ascend(state: GameState, now: number = Date.now()): number {
  if (!canAscend(state)) return 0;
  const gained = pendingDread(state);
  const depth = state.descent.maxFloor;
  resetRun(state, now);
  const p = state.prestige;
  p.bestFloor = Math.max(p.bestFloor, depth);
  p.shards = 0;
  p.shardsEarned = 0;
  p.pact = [];
  p.autoBuy = true;
  p.curses = [];
  p.nextCurses = [];
  p.runStartedAt = state.meta.playTimeSeconds;
  state.magic.autoCast = true;
  const l = state.lich;
  l.dread += gained;
  l.dreadEarned += gained;
  l.ascensions += 1;
  applyRunStart(state);
  addLog(
    state,
    'story',
    `You die a second time, on purpose. What rises is no longer a necromancer but a Lich, carrying ${gained} Dread. The Shards are gone. You will not need them as much.`,
  );
  return gained;
}


/** Resets everything that belongs to a single run. */
function resetRun(state: GameState, now: number): void {
  if (state.rift.active) closeRift(state);
  const keepWardens = pactEffects(state, 'keepWardens').length > 0;
  const wardens = Object.fromEntries(Object.entries(state.crypt.graveworks).map(([id, g]) => [id, g.warden]));
  const keepElites = Math.max(0, ...pactEffects(state, 'keepElites').map((e) => e.fraction));
  const elites = Object.fromEntries(Object.entries(state.army.elites).map(([id, lvl]) => [id, Math.floor(lvl * keepElites)]));

  const eliteGems = state.army.eliteGems;
  const fresh = createInitialState(now, state.rng.state);
  state.resources = fresh.resources;
  state.army = { ...fresh.army, eliteGems };
  state.crypt = fresh.crypt;
  state.upgrades = fresh.upgrades;
  state.descent = fresh.descent;
  state.events = fresh.events;
  state.army.elites = { ...state.army.elites, ...elites };
  state.magic = { ...state.magic, essence: 0, cooldowns: {} };
  state.prestige.coven = null;
  state.prestige.curses = [...state.prestige.nextCurses];
  if (keepWardens) {
    for (const [id, had] of Object.entries(wardens)) {
      const entry = state.crypt.graveworks[id];
      if (entry && had) entry.warden = true;
    }
  }
}

/**
 * Automatic raising (Dark Pact): buys the best damage-per-Bone minion while it costs
 * no more than half the current Bones, so some are left for upgrades.
 */
export function autoBuy(state: GameState): number {
  if (!state.prestige.autoBuy || !hasPact(state, 'autoRaise')) return 0;
  let bought = 0;
  for (let guard = 0; guard < 50; guard++) {
    let best: { id: string; value: number; cost: Decimal } | null = null;
    for (const m of MINIONS) {
      if (!minionVisible(state, m.id)) continue;
      const cost = purchaseCost(state, m.id, 1);
      const value = unitDps(state, m.id).div(cost).toNumber();
      if (!best || value > best.value) best = { id: m.id, value, cost };
    }
    if (!best || best.cost.gt(state.resources.bones.mul(0.5))) break;
    if (buyMinion(state, best.id, 1) === 0) break;
    bought++;
  }
  return bought;
}

/** Shards the next Rebirth would grant at a given floor (for the preview table). */
export function shardPreview(floors: readonly number[]): { floor: number; shards: number }[] {
  return floors.map((floor) => ({ floor, shards: shardsForFloor(floor) }));
}

