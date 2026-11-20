import type { Decimal } from '../engine/bignum';
import { formatDuration, formatNumber } from '../engine/format';
import type { BuyAmount, GameState, LogEntry } from '../engine/state';
import { BUFFS, type BuffId } from '../content/events';
import { GRAVEWORKS, GRAVEWORKS_MILESTONES } from '../content/graveworks';
import { isBossFloor, layerForFloor } from '../content/layers';
import { MINIONS, MINION_MILESTONES } from '../content/minions';
import { armyDps, minionDps, minionVisible, ownedCount, purchaseCost, purchaseCount, unitDps } from '../systems/army';
import {
  cycleSeconds,
  graveworksOwned,
  graveworksPurchaseCost,
  graveworksPurchaseCount,
  graveworksRate,
  graveworksVisible,
  revenuePerCycle,
} from '../systems/crypt';
import { currentEnemyName, enemyMaxHp, killsForFloor } from '../systems/descent';
import { totalIncome } from '../systems/income';
import { bossTimerSeconds, depthBonus, nextMilestone } from '../systems/modifiers';
import { clickDamage } from '../systems/siphon';
import { availableUpgrades } from '../systems/upgrades';
import { isUnlocked } from '../systems/unlocks';

/** Plain, pre-formatted snapshot of the state for the UI. Rebuilt every render frame. */
export function buildView(state: GameState) {
  const n = state.settings.notation;
  const fmt = (x: Decimal | number) => formatNumber(x, n);
  const bones = state.resources.bones;
  const buyAmount: BuyAmount = isUnlocked(state, 'bulkBuy') ? state.settings.buyAmount : 1;
  const d = state.descent;
  const boss = isBossFloor(d.floor);
  const maxHp = enemyMaxHp(d.floor);

  const minions = MINIONS.filter((m) => minionVisible(state, m.id)).map((m) => {
    const count = purchaseCount(state, m.id, buyAmount);
    const shownCount = Math.max(1, count);
    const cost = purchaseCost(state, m.id, shownCount);
    const owned = ownedCount(state, m.id);
    return {
      id: m.id,
      name: m.name,
      description: m.description,
      trait: m.trait ?? null,
      owned,
      buyCount: shownCount,
      cost: fmt(cost),
      affordable: count > 0 && bones.gte(cost),
      dpsEach: fmt(unitDps(state, m.id)),
      dpsTotal: fmt(minionDps(state, m.id)),
      nextMilestone: nextMilestone(owned, MINION_MILESTONES),
    };
  });

  const graveworks = GRAVEWORKS.filter((g) => graveworksVisible(state, g.id)).map((g) => {
    const e = state.crypt.graveworks[g.id]!;
    const count = graveworksPurchaseCount(state, g.id, buyAmount);
    const shownCount = Math.max(1, count);
    const cost = graveworksPurchaseCost(state, g.id, shownCount);
    const owned = graveworksOwned(state, g.id);
    const cycle = cycleSeconds(state, g.id);
    return {
      id: g.id,
      name: g.name,
      description: g.description,
      owned,
      buyCount: shownCount,
      cost: fmt(cost),
      affordable: count > 0 && bones.gte(cost),
      cycle: cycle < 1 ? `${cycle.toFixed(2)}s` : formatDuration(cycle),
      /** Very fast cycles render as a full, steady bar. */
      fast: cycle < 0.25,
      progress: e.warden || e.running ? e.progress * 100 : 0,
      running: e.warden || e.running,
      canStart: owned > 0 && !e.warden && !e.running,
      revenue: fmt(revenuePerCycle(state, g.id)),
      rate: fmt(graveworksRate(state, g.id)),
      warden: e.warden,
      wardenName: g.warden.name,
      wardenQuirk: g.warden.quirk,
      wardenCost: fmt(g.warden.cost),
      wardenVisible: !e.warden && owned > 0 && isUnlocked(state, 'wardens'),
      wardenAffordable: bones.gte(g.warden.cost),
      nextMilestone: nextMilestone(owned, GRAVEWORKS_MILESTONES),
    };
  });

  const upgrades = availableUpgrades(state).map((u) => ({
    id: u.id,
    name: u.name,
    description: u.description,
    flavor: u.flavor,
    cost: fmt(u.cost),
    affordable: bones.gte(u.cost),
  }));

  const buffs = (Object.keys(state.events.buffs) as BuffId[]).map((id) => ({
    id,
    name: BUFFS[id].name,
    description: BUFFS[id].description,
    timeLeft: Math.ceil(state.events.buffs[id] ?? 0),
  }));

  return {
    bones: fmt(bones.floor()),
    income: fmt(totalIncome(state)),
    dps: fmt(armyDps(state)),
    bossDps: fmt(armyDps(state, true)),
    clickDamage: fmt(clickDamage(state)),
    layerName: layerForFloor(d.floor).name,
    floor: d.floor,
    maxFloor: d.maxFloor,
    killsOnFloor: d.killsOnFloor,
    killsPerFloor: killsForFloor(d.floor),
    enemyName: currentEnemyName(state),
    isBoss: boss,
    bossTimeLeft: Math.max(0, d.bossTimeLeft),
    bossTimerPercent: boss ? Math.max(0, Math.min(100, (d.bossTimeLeft / bossTimerSeconds(state)) * 100)) : 0,
    autoAdvance: d.autoAdvance,
    canChallenge: !d.autoAdvance,
    enemyHp: fmt(d.enemyHp.ceil()),
    enemyMaxHp: fmt(maxHp.ceil()),
    hpPercent: Math.max(0, Math.min(100, d.enemyHp.div(maxHp).toNumber() * 100)),
    minions,
    graveworks,
    upgrades,
    buffs,
    soul: state.events.soul,
    log: state.log as readonly LogEntry[],
    cryptUnlocked: isUnlocked(state, 'crypt'),
    bulkBuyUnlocked: isUnlocked(state, 'bulkBuy'),
    depthBonus: depthBonus(state).toFixed(2),
    buyAmount,
    notation: n,
    stats: {
      playTime: formatDuration(state.meta.playTimeSeconds),
      lastSavedAt: state.meta.lastSavedAt,
      lifetimeBones: fmt(state.stats.lifetimeBones.floor()),
      totalKills: fmt(state.stats.totalKills),
      totalClicks: fmt(state.stats.totalClicks),
      bossesDefeated: state.stats.bossesDefeated,
      bossesFailed: state.stats.bossesFailed,
      soulsCaught: state.stats.soulsCaught,
      saveVersion: state.version,
      rngState: state.rng.state,
      soulCooldown: Math.ceil(state.events.soulCooldown),
    },
  };
}

export type GameView = ReturnType<typeof buildView>;
