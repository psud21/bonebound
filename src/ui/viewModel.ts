import { formatDuration, formatNumber } from '../engine/format';
import type { BuyAmount, GameState } from '../engine/state';
import { BALANCE } from '../content/balance';
import { MINIONS } from '../content/minions';
import { armyDps, minionDps, ownedCount, purchaseCost, purchaseCount } from '../systems/army';
import { floorMaxHp } from '../systems/descent';
import { clickDamage } from '../systems/siphon';

export interface MinionView {
  id: string;
  name: string;
  description: string;
  owned: number;
  buyCount: number;
  cost: string;
  affordable: boolean;
  dpsEach: string;
  dpsTotal: string;
}

/** Plain, pre-formatted snapshot of the state for the UI. Rebuilt every render frame. */
export function buildView(state: GameState) {
  const n = state.settings.notation;
  const fmt = (x: Parameters<typeof formatNumber>[0]) => formatNumber(x, n);
  const dps = armyDps(state);
  const maxHp = floorMaxHp(state.descent.floor);
  const buyAmount: BuyAmount = state.settings.buyAmount;

  const minions: MinionView[] = MINIONS.map((m) => {
    const count = purchaseCount(state, m.id, buyAmount);
    const shownCount = Math.max(1, count);
    const cost = purchaseCost(state, m.id, shownCount);
    return {
      id: m.id,
      name: m.name,
      description: m.description,
      owned: ownedCount(state, m.id),
      buyCount: shownCount,
      cost: fmt(cost),
      affordable: count > 0 && state.resources.bones.gte(cost),
      dpsEach: fmt(m.baseDps),
      dpsTotal: fmt(minionDps(state, m.id)),
    };
  });

  return {
    bones: fmt(state.resources.bones.floor()),
    bonesPerSecond: fmt(dps.mul(BALANCE.BONES_PER_HP)),
    dps: fmt(dps),
    clickDamage: fmt(clickDamage(state)),
    floor: state.descent.floor,
    maxFloor: state.descent.maxFloor,
    killsOnFloor: state.descent.killsOnFloor,
    killsPerFloor: BALANCE.KILLS_PER_FLOOR,
    enemyHp: fmt(state.descent.enemyHp.ceil()),
    enemyMaxHp: fmt(maxHp.ceil()),
    hpPercent: Math.max(0, Math.min(100, state.descent.enemyHp.div(maxHp).toNumber() * 100)),
    minions,
    buyAmount,
    notation: n,
    playTime: formatDuration(state.meta.playTimeSeconds),
    lastSavedAt: state.meta.lastSavedAt,
    lifetimeBones: fmt(state.stats.lifetimeBones.floor()),
    totalKills: fmt(state.stats.totalKills),
    totalClicks: fmt(state.stats.totalClicks),
    saveVersion: state.version,
    rngState: state.rng.state,
  };
}

export type GameView = ReturnType<typeof buildView>;
