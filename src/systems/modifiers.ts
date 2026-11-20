import type { GameState } from '../engine/state';
import { BALANCE } from '../content/balance';
import { BUFF_MULTIPLIERS, type BuffId } from '../content/events';
import { GRAVEWORKS_MILESTONES } from '../content/graveworks';
import { MINION_MILESTONES } from '../content/minions';
import { UPGRADES_BY_ID, type Effect } from '../content/upgrades';
import { gearStat, hasLegendary } from './gear';
import { raiseLegionMultiplier } from './magic';
import { pactEffects, shardMultiplier } from './prestige';

/** All effects from purchased upgrades. */
function* effects(state: GameState): Generator<Effect> {
  for (const id of state.upgrades.purchased) {
    const def = UPGRADES_BY_ID[id];
    if (def) yield* def.effects;
  }
}

function product(state: GameState, match: (e: Effect) => number | null): number {
  let result = 1;
  for (const e of effects(state)) {
    const m = match(e);
    if (m !== null) result *= m;
  }
  return result;
}

function sum(state: GameState, match: (e: Effect) => number | null): number {
  let result = 0;
  for (const e of effects(state)) {
    const v = match(e);
    if (v !== null) result += v;
  }
  return result;
}

const pct = (state: GameState, stat: string) => 1 + gearStat(state, stat) / 100;

export function buffActive(state: GameState, id: BuffId): boolean {
  return (state.events.buffs[id] ?? 0) > 0;
}

/** Count of thresholds reached in a milestone list. */
export function milestonesReached(owned: number, thresholds: readonly number[]): number {
  let n = 0;
  for (const t of thresholds) if (owned >= t) n++;
  return n;
}

export function nextMilestone(owned: number, thresholds: readonly number[]): number | null {
  for (const t of thresholds) if (owned < t) return t;
  return null;
}

/** Multiplier on every minion's damage: upgrades, gear, Soul Shards and buffs. */
export function allDamageMultiplier(state: GameState): number {
  let m = product(state, (e) => (e.kind === 'allDamageMult' ? e.mult : null));
  m *= pct(state, 'minionDamage') * shardMultiplier(state);
  if (buffActive(state, 'bloodMoon')) m *= BUFF_MULTIPLIERS.bloodMoon;
  if (buffActive(state, 'raiseLegion')) m *= raiseLegionMultiplier(state);
  return m;
}

/** Full multiplier for one minion type: milestones × its upgrades × gear × legendaries × global. */
export function minionMultiplier(state: GameState, id: string): number {
  const owned = state.army.minions[id]?.owned ?? 0;
  const milestones = 2 ** milestonesReached(owned, MINION_MILESTONES);
  const own = product(state, (e) => (e.kind === 'minionMult' && e.id === id ? e.mult : null));
  const legendary = hasLegendary(state, 'minionMult').reduce((m, e) => (e.id === id ? m * e.mult : m), 1);
  return milestones * own * legendary * pct(state, `minion:${id}`) * allDamageMultiplier(state);
}

/** Extra multiplier against guardians (on top of minion traits). */
export function bossDamageMultiplier(state: GameState): number {
  return pct(state, 'bossDamage');
}

/** Multiplier on every Bone gained from any source. */
export function bonesMultiplier(state: GameState): number {
  let m = product(state, (e) => (e.kind === 'bonesMult' ? e.mult : null));
  m *= pct(state, 'bones');
  if (buffActive(state, 'soulFrenzy')) m *= BUFF_MULTIPLIERS.soulFrenzy;
  return m;
}

/** Crypt output grows with the deepest floor reached this run. */
export function depthBonus(state: GameState): number {
  return BALANCE.DEPTH_BONUS ** (state.descent.maxFloor - 1);
}

/** Multiplier on all Crypt output, excluding the global Bones multiplier. */
export function cryptMultiplier(state: GameState): number {
  return (
    depthBonus(state) * product(state, (e) => (e.kind === 'cryptMult' ? e.mult : null)) * pct(state, 'crypt')
  );
}

export function graveworksRevenueMultiplier(state: GameState, id: string, hasWarden = false): number {
  const own = product(state, (e) => (e.kind === 'graveworksMult' && e.id === id ? e.mult : null));
  const warden = hasWarden ? hasLegendary(state, 'wardenMult').reduce((m, e) => m * e.mult, 1) : 1;
  return own * warden;
}

/** Each graveworks milestone halves cycle time; Ossuary Rite triples speed. */
export function graveworksSpeedMultiplier(state: GameState, id: string): number {
  const owned = state.crypt.graveworks[id]?.owned ?? 0;
  const rite = buffActive(state, 'ossuaryRite') ? BUFF_MULTIPLIERS.ossuaryRite : 1;
  return 2 ** milestonesReached(owned, GRAVEWORKS_MILESTONES) * rite;
}

export function clickFlatBonus(state: GameState): number {
  return sum(state, (e) => (e.kind === 'clickFlat' ? e.amount : null));
}

export function clickDpsPercent(state: GameState): number {
  return sum(state, (e) => (e.kind === 'clickDpsPercent' ? e.percent : null));
}

/** Multiplier on Siphon damage from gear and the Dark Pact. */
export function clickMultiplier(state: GameState): number {
  return pct(state, 'clickDamage') * pactEffects(state, 'clickMult').reduce((m, e) => m * e.mult, 1);
}

export function bossTimerSeconds(state: GameState): number {
  return (
    BALANCE.BOSS_TIMER_SECONDS +
    sum(state, (e) => (e.kind === 'bossTimer' ? e.seconds : null)) +
    gearStat(state, 'bossTimer') +
    hasLegendary(state, 'bossTimer').reduce((s, e) => s + e.seconds, 0) +
    pactEffects(state, 'bossTimer').reduce((s, e) => s + e.seconds, 0)
  );
}

export function soulBoosted(state: GameState): boolean {
  return hasLegendary(state, 'soulBoost').length > 0;
}

export function soulFrequencyMultiplier(state: GameState): number {
  return (
    product(state, (e) => (e.kind === 'soulFrequency' ? e.mult : null)) *
    pct(state, 'soulFrequency') *
    pactEffects(state, 'soulFrequency').reduce((m, e) => m * e.mult, 1) *
    (soulBoosted(state) ? 2 : 1)
  );
}
