import { D, Decimal } from '../engine/bignum';
import type { GameState } from '../engine/state';
import { BALANCE } from '../content/balance';
import { enemyName, isBossFloor } from '../content/layers';
import { addLog } from './log';
import { bossTimerSeconds } from './modifiers';
import { chance } from '../engine/rng';
import { hasLegendary } from './gear';
import { rollDrops } from './loot';
import { gainBones } from './resources';

/** HP of a normal enemy on this floor. */
export function floorBaseHp(floor: number): Decimal {
  return D(BALANCE.FLOOR_HP_BASE).mul(Decimal.pow(BALANCE.FLOOR_HP_GROWTH, floor));
}

/** HP of the enemy (or boss) on this floor. */
export function enemyMaxHp(floor: number): Decimal {
  const hp = floorBaseHp(floor);
  return isBossFloor(floor) ? hp.mul(BALANCE.BOSS_HP_MULT) : hp;
}

export function killsForFloor(floor: number): number {
  return isBossFloor(floor) ? 1 : BALANCE.KILLS_PER_FLOOR;
}

/** Base Bones per kill, before the global Bones multiplier. */
export function bonesPerKill(floor: number): Decimal {
  return enemyMaxHp(floor).mul(bonesPerHp(floor));
}

/** Bones earned per point of damage dealt on this floor. */
export function bonesPerHp(floor: number): number {
  return BALANCE.BONES_PER_HP * BALANCE.BONES_PER_HP_DECAY ** (floor - 1);
}

/** A boss floor the player hasn't beaten yet (the deepest floor reached is a boss). */
export function isUnbeatenBoss(state: GameState, floor: number): boolean {
  return isBossFloor(floor) && floor >= state.descent.maxFloor;
}

export function onBossFloor(state: GameState): boolean {
  return isBossFloor(state.descent.floor);
}

export function currentEnemyName(state: GameState): string {
  return enemyName(state.descent.floor, state.descent.killsOnFloor);
}

/** Moves to a floor with a fresh enemy. */
export function enterFloor(state: GameState, floor: number): void {
  const d = state.descent;
  d.floor = Math.max(1, floor);
  d.killsOnFloor = 0;
  d.enemyHp = enemyMaxHp(d.floor);
  d.maxFloor = Math.max(d.maxFloor, d.floor);
  state.prestige.bestFloor = Math.max(state.prestige.bestFloor, d.maxFloor);
  if (isBossFloor(d.floor)) d.bossTimeLeft = bossTimerSeconds(state);
}

export interface DamageOptions {
  /**
   * Highest floor the army may advance to. Once there, it keeps farming that floor.
   * Offline progress uses this so it never pushes new floors.
   */
  floorCap?: number;
}

export interface DamageResult {
  kills: number;
  bones: Decimal;
  floorsCleared: number;
  bossesDefeated: number;
}

/**
 * Applies damage to the current enemy. Overkill carries over to the next enemies,
 * and full-HP enemies on the same floor are killed in one batch so big hits stay cheap.
 */
export function dealDamage(state: GameState, amount: Decimal, options: DamageOptions = {}): DamageResult {
  const result: DamageResult = { kills: 0, bones: new Decimal(0), floorsCleared: 0, bossesDefeated: 0 };
  const d = state.descent;
  let remaining = D(amount);

  // Each iteration finishes at most one floor, so this bound is generous.
  for (let guard = 0; guard < 100_000 && remaining.gt(0); guard++) {
    if (remaining.lt(d.enemyHp)) {
      d.enemyHp = d.enemyHp.sub(remaining);
      break;
    }

    remaining = remaining.sub(d.enemyHp);
    const floor = d.floor;
    const maxHp = enemyMaxHp(floor);
    const perFloor = killsForFloor(floor);
    const canAdvance = d.autoAdvance && (options.floorCap === undefined || floor < options.floorCap);
    const enemiesLeft = canAdvance ? perFloor - d.killsOnFloor - 1 : Number.POSITIVE_INFINITY;
    const extra = Math.max(0, Math.min(enemiesLeft, remaining.div(maxHp).floor().toNumber()));
    const kills = 1 + extra;
    remaining = remaining.sub(maxHp.mul(extra));

    const bones = gainBones(state, bonesPerKill(floor).mul(kills));
    result.bones = result.bones.add(bones);
    result.kills += kills;
    state.stats.totalKills += kills;

    rollDrops(state, floor, kills, isBossFloor(floor));

    if (isBossFloor(floor)) {
      state.stats.bossesDefeated += kills;
      result.bossesDefeated += kills;
      if (canAdvance) addLog(state, 'boss', `${enemyName(floor, 0)} has fallen. Floor ${floor} is yours.`);
    }

    if (canAdvance) {
      d.killsOnFloor += kills;
      if (d.killsOnFloor >= perFloor) {
        enterFloor(state, floor + 1);
        result.floorsCleared += 1;
        // Striders of the Deep: sometimes the next floor falls too.
        if (options.floorCap === undefined) {
          for (const e of hasLegendary(state, 'floorSkip')) {
            if (chance(state.rng, e.chance)) result.floorsCleared += skipFloors(state, 1);
          }
        }
        continue;
      }
    } else {
      d.killsOnFloor = (d.killsOnFloor + kills) % perFloor;
    }
    d.enemyHp = maxHp;
  }

  return result;
}

/** Counts down the boss timer. Losing pushes the army back a floor and stops auto-advance. */
export function updateBossTimer(state: GameState, dt: number): void {
  if (!onBossFloor(state)) return;
  const d = state.descent;
  d.bossTimeLeft -= dt;
  if (d.bossTimeLeft > 0) return;
  const name = currentEnemyName(state);
  state.stats.bossesFailed += 1;
  d.autoAdvance = false;
  enterFloor(state, d.floor - 1);
  addLog(state, 'boss', `${name} drove your army back. Grow stronger, then challenge it again.`);
}

/** Resumes descending after a boss loss. */
export function challengeBoss(state: GameState): void {
  const d = state.descent;
  d.autoAdvance = true;
  if (d.floor < d.maxFloor) enterFloor(state, d.floor + 1);
}

/** Highest floor offline progress may farm: never an unbeaten boss. */
export function offlineFloorCap(state: GameState): number {
  const max = state.descent.maxFloor;
  return isBossFloor(max) ? max - 1 : max;
}

/**
 * Instantly clears up to `count` floors (Grave Rush), awarding their Bones.
 * Stops before an unbeaten boss. Returns floors skipped.
 */
export function skipFloors(state: GameState, count: number): number {
  let skipped = 0;
  for (let i = 0; i < count; i++) {
    const d = state.descent;
    if (isUnbeatenBoss(state, d.floor) || isUnbeatenBoss(state, d.floor + 1)) break;
    const remaining = killsForFloor(d.floor) - d.killsOnFloor;
    gainBones(state, bonesPerKill(d.floor).mul(remaining));
    state.stats.totalKills += remaining;
    enterFloor(state, d.floor + 1);
    skipped++;
  }
  return skipped;
}
