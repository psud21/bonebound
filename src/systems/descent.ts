import { D, Decimal } from '../engine/bignum';
import type { GameState } from '../engine/state';
import { BALANCE } from '../content/balance';
import { gainBones } from './resources';

export function floorMaxHp(floor: number): Decimal {
  return D(BALANCE.FLOOR_HP_BASE).mul(Decimal.pow(BALANCE.FLOOR_HP_GROWTH, floor));
}

export function bonesPerKill(floor: number): Decimal {
  return floorMaxHp(floor).mul(BALANCE.BONES_PER_HP);
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
}

/**
 * Applies damage to the current enemy. Overkill carries over to the next enemies,
 * and full-HP enemies on the same floor are killed in one batch so big hits stay cheap.
 */
export function dealDamage(state: GameState, amount: Decimal, options: DamageOptions = {}): DamageResult {
  const result: DamageResult = { kills: 0, bones: new Decimal(0), floorsCleared: 0 };
  const d = state.descent;
  const perFloor = BALANCE.KILLS_PER_FLOOR;
  let remaining = D(amount);

  // Each iteration finishes at most one floor, so this bound is generous.
  for (let guard = 0; guard < 100_000 && remaining.gt(0); guard++) {
    if (remaining.lt(d.enemyHp)) {
      d.enemyHp = d.enemyHp.sub(remaining);
      break;
    }

    remaining = remaining.sub(d.enemyHp);
    const maxHp = floorMaxHp(d.floor);
    const canAdvance = options.floorCap === undefined || d.floor < options.floorCap;
    const enemiesLeft = canAdvance ? perFloor - d.killsOnFloor - 1 : Number.POSITIVE_INFINITY;
    const extra = Math.max(0, Math.min(enemiesLeft, remaining.div(maxHp).floor().toNumber()));
    const kills = 1 + extra;
    remaining = remaining.sub(maxHp.mul(extra));

    const bones = bonesPerKill(d.floor).mul(kills);
    gainBones(state, bones);
    result.bones = result.bones.add(bones);
    result.kills += kills;
    state.stats.totalKills += kills;

    if (canAdvance) {
      d.killsOnFloor += kills;
      if (d.killsOnFloor >= perFloor) {
        d.floor += 1;
        d.killsOnFloor = 0;
        d.maxFloor = Math.max(d.maxFloor, d.floor);
        result.floorsCleared += 1;
      }
    } else {
      d.killsOnFloor = (d.killsOnFloor + kills) % perFloor;
    }
    d.enemyHp = floorMaxHp(d.floor);
  }

  return result;
}
