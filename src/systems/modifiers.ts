import type { GameState } from '../engine/state';
import { BALANCE } from '../content/balance';
import { BUFF_MULTIPLIERS } from '../content/events';
import { GRAVEWORKS_MILESTONES } from '../content/graveworks';
import { MAX_GUARDIAN_SHRED, MINIONS, MINION_MILESTONES } from '../content/minions';
import { UPGRADES_BY_ID, type Effect } from '../content/upgrades';
import { buffActive } from './buffs';
import { covenEffects } from './covens';
import { eliteArmyDamage, eliteBones, eliteGuardianDamage, eliteGuardianTimer } from './elites';
import { featMultiplier } from './feats';
import { gearStat, hasLegendary } from './gear';
import { burnMultiplier, slowMultiplier, swarmMultiplier, voidTimerMultiplier } from './hazards';
import { curseEffects } from './curses';
import { dreadMultiplier, lichArmyMultiplier, lichEffects } from './lichdom';
import { riftMasteryMultiplier } from './rifts';
import { researchProduct } from './library';
import { spellBuffValue } from './magic';
import { pactEffects, shardMultiplier } from './prestige';

export { buffActive };

/** Every purchased upgrade's effects, folded into totals. */
interface UpgradeTotals {
  allDamage: number;
  minion: Map<string, number>;
  graveworks: Map<string, number>;
  bones: number;
  crypt: number;
  soulFrequency: number;
  clickFlat: number;
  clickDpsPercent: number;
  bossTimer: number;
}

function foldUpgrades(purchased: readonly string[]): UpgradeTotals {
  const t: UpgradeTotals = {
    allDamage: 1,
    minion: new Map(),
    graveworks: new Map(),
    bones: 1,
    crypt: 1,
    soulFrequency: 1,
    clickFlat: 0,
    clickDpsPercent: 0,
    bossTimer: 0,
  };
  for (const id of purchased) {
    for (const e of UPGRADES_BY_ID[id]?.effects ?? ([] as readonly Effect[])) {
      switch (e.kind) {
        case 'allDamageMult':
          t.allDamage *= e.mult;
          break;
        case 'minionMult':
          t.minion.set(e.id, (t.minion.get(e.id) ?? 1) * e.mult);
          break;
        case 'graveworksMult':
          t.graveworks.set(e.id, (t.graveworks.get(e.id) ?? 1) * e.mult);
          break;
        case 'bonesMult':
          t.bones *= e.mult;
          break;
        case 'cryptMult':
          t.crypt *= e.mult;
          break;
        case 'soulFrequency':
          t.soulFrequency *= e.mult;
          break;
        case 'clickFlat':
          t.clickFlat += e.amount;
          break;
        case 'clickDpsPercent':
          t.clickDpsPercent += e.percent;
          break;
        case 'bossTimer':
          t.bossTimer += e.seconds;
          break;
      }
    }
  }
  return t;
}

/**
 * Cached per purchased-list object. Upgrades are only ever appended (or the list is replaced
 * on Rebirth), so length plus the last id identifies the contents. The simulator's
 * push-then-pop probing also round-trips correctly.
 */
const upgradeCache = new WeakMap<readonly string[], { key: string; totals: UpgradeTotals }>();

function upgrades(state: GameState): UpgradeTotals {
  const list = state.upgrades.purchased;
  const key = `${list.length}:${list[list.length - 1] ?? ''}`;
  const hit = upgradeCache.get(list);
  if (hit && hit.key === key) return hit.totals;
  const totals = foldUpgrades(list);
  upgradeCache.set(list, { key, totals });
  return totals;
}

const pct = (state: GameState, stat: string) => 1 + gearStat(state, stat) / 100;

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

/**
 * Multiplier on all damage (minions and Siphon's base damage): upgrades, gear, Soul Shards,
 * Elites, feats, research, covens, set bonuses and buffs.
 */
export function allDamageMultiplier(state: GameState): number {
  let m = upgrades(state).allDamage;
  m *= pct(state, 'minionDamage') * shardMultiplier(state);
  m *= eliteArmyDamage(state) * featMultiplier(state) * researchProduct(state, 'minionDamage');
  m *= covenEffects(state).minionDamage ?? 1;
  m *= hasLegendary(state, 'allDamage').reduce((x, e) => x * e.mult, 1);
  m *= lichArmyMultiplier(state) * riftMasteryMultiplier(state);
  m *= curseEffects(state, 'damage').reduce((x, e) => x * e.mult, 1);
  if (buffActive(state, 'bloodMoon')) m *= BUFF_MULTIPLIERS.bloodMoon;
  for (const buff of ['raiseLegion', 'bloodRite', 'plagueWind', 'rot', 'eclipse', 'armyOfTheDead'] as const) {
    if (buffActive(state, buff)) m *= spellBuffValue(state, buff);
  }
  return m;
}

/** Death Knights strengthen every minion below them. */
export function lowerTierBoost(state: GameState, id: string): number {
  const index = MINIONS.findIndex((m) => m.id === id);
  let boost = 1;
  for (let i = index + 1; i < MINIONS.length; i++) {
    const m = MINIONS[i]!;
    if (m.lowerTierBoost) boost += m.lowerTierBoost * (state.army.minions[m.id]?.owned ?? 0);
  }
  return boost;
}

/** Full multiplier for one minion type: milestones × its upgrades × gear × legendaries × hazards × global. */
export function minionMultiplier(state: GameState, id: string): number {
  const owned = state.army.minions[id]?.owned ?? 0;
  const milestones = 2 ** milestonesReached(owned, MINION_MILESTONES);
  const own = upgrades(state).minion.get(id) ?? 1;
  const legendary = hasLegendary(state, 'minionMult').reduce((m, e) => (e.id === id ? m * e.mult : m), 1);
  const def = MINIONS.find((m) => m.id === id);
  const hazards =
    burnMultiplier(state, def?.burnImmune === true) * slowMultiplier(state) * swarmMultiplier(state, def?.swarmMult);
  return (
    milestones * own * legendary * pct(state, `minion:${id}`) * lowerTierBoost(state, id) * hazards * allDamageMultiplier(state)
  );
}

/** Extra multiplier against guardians (on top of minion traits). */
export function bossDamageMultiplier(state: GameState): number {
  let m = pct(state, 'bossDamage') * eliteGuardianDamage(state) * (covenEffects(state).guardianDamage ?? 1);
  m *= hasLegendary(state, 'guardianDamage').reduce((x, e) => x * e.mult, 1);
  if (buffActive(state, 'curseOfFrailty')) m *= spellBuffValue(state, 'curseOfFrailty');
  return m;
}

/** Extra multiplier against ordinary enemies. */
export function normalDamageMultiplier(state: GameState): number {
  return buffActive(state, 'pestilence') ? spellBuffValue(state, 'pestilence') : 1;
}

/** Fraction of a guardian's HP that Banshees strip as the fight begins. */
export function guardianShred(state: GameState): number {
  let shred = 0;
  for (const m of MINIONS) if (m.guardianShred) shred += m.guardianShred * (state.army.minions[m.id]?.owned ?? 0);
  return Math.min(MAX_GUARDIAN_SHRED, shred);
}

/** Multiplier on every Bone gained from any source. */
export function bonesMultiplier(state: GameState): number {
  let m = upgrades(state).bones;
  m *= pct(state, 'bones') * eliteBones(state) * (covenEffects(state).bones ?? 1) * dreadMultiplier(state);
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
    depthBonus(state) *
    upgrades(state).crypt *
    pct(state, 'crypt') *
    researchProduct(state, 'crypt') *
    curseEffects(state, 'crypt').reduce((m, e) => m * e.mult, 1)
  );
}

export function graveworksRevenueMultiplier(state: GameState, id: string, hasWarden = false): number {
  const own = upgrades(state).graveworks.get(id) ?? 1;
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
  return upgrades(state).clickFlat;
}

export function clickDpsPercent(state: GameState): number {
  return upgrades(state).clickDpsPercent;
}

/** Multiplier on Siphon damage from gear, the Dark Pact, set bonuses, covens and Eclipse. */
export function clickMultiplier(state: GameState): number {
  let m = pct(state, 'clickDamage') * pactEffects(state, 'clickMult').reduce((x, e) => x * e.mult, 1);
  m *= hasLegendary(state, 'clickMult').reduce((x, e) => x * e.mult, 1) * (covenEffects(state).click ?? 1);
  m *= lichEffects(state, 'gaze').reduce((x, e) => x * e.click, 1);
  if (curseEffects(state, 'noSiphon').length > 0) return 0;
  if (buffActive(state, 'eclipse')) m *= 10 * spellBuffValue(state, 'eclipse', 'click');
  return m;
}

export function bossTimerSeconds(state: GameState): number {
  const seconds =
    BALANCE.BOSS_TIMER_SECONDS +
    curseEffects(state, 'bossTimer').reduce((s, e) => s + e.seconds, 0) +
    upgrades(state).bossTimer +
    gearStat(state, 'bossTimer') +
    hasLegendary(state, 'bossTimer').reduce((s, e) => s + e.seconds, 0) +
    pactEffects(state, 'bossTimer').reduce((s, e) => s + e.seconds, 0) +
    eliteGuardianTimer(state);
  return Math.max(5, seconds * voidTimerMultiplier(state));
}

export function soulBoosted(state: GameState): boolean {
  return hasLegendary(state, 'soulBoost').length > 0;
}

export function soulFrequencyMultiplier(state: GameState): number {
  return (
    upgrades(state).soulFrequency *
    pct(state, 'soulFrequency') *
    pactEffects(state, 'soulFrequency').reduce((m, e) => m * e.mult, 1) *
    (soulBoosted(state) ? 2 : 1)
  );
}
