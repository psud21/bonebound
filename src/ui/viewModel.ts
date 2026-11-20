import type { Decimal } from '../engine/bignum';
import { formatDuration, formatNumber } from '../engine/format';
import type { BuyAmount, GameState, LogEntry } from '../engine/state';
import { BUFFS, type BuffId } from '../content/events';
import { GRAVEWORKS, GRAVEWORKS_BY_ID, GRAVEWORKS_MILESTONES } from '../content/graveworks';
import { bossFor, foeFor, isBossFloor, layerForFloor } from '../content/layers';
import { MINIONS, MINIONS_BY_ID, MINION_MILESTONES } from '../content/minions';
import { SEALED_FEATURES } from '../content/roadmap';
import { UNLOCKS } from '../content/story';
import type { UpgradeDef } from '../content/upgrades';
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
import { enemyMaxHp, killsForFloor } from '../systems/descent';
import { totalIncome } from '../systems/income';
import { bossTimerSeconds, depthBonus, nextMilestone } from '../systems/modifiers';
import { describeCondition, upcomingUnlocks, upcomingUpgrades } from '../systems/progress';
import { clickDamage } from '../systems/siphon';
import { availableUpgrades } from '../systems/upgrades';
import { isUnlocked } from '../systems/unlocks';
import type { IconName } from './icons.generated';
import { buildCovens, buildElites, buildFeats, buildGrimoire, buildLibrary, buildPhylactery, buildRelics } from './sections';
import { minionAvailable } from '../systems/army';
import { hazardFactor, regenRate } from '../systems/hazards';
import { layerNumber } from '../content/layers';
import { hasPact } from '../systems/prestige';

/** How many locked items are previewed by name before the rest show as "???". */
const PREVIEW_LOCKED = 2;

export function upgradeIcon(def: UpgradeDef): IconName {
  const e = def.effects[0];
  switch (e?.kind) {
    case 'minionMult':
      return MINIONS_BY_ID[e.id]?.icon ?? 'raise-skeleton';
    case 'graveworksMult':
      return GRAVEWORKS_BY_ID[e.id]?.icon ?? 'graveyard';
    case 'allDamageMult':
      return 'pentacle';
    case 'clickFlat':
    case 'clickDpsPercent':
      return 'skeletal-hand';
    case 'cryptMult':
      return 'graveyard';
    case 'bonesMult':
      return 'two-coins';
    case 'bossTimer':
      return 'sands-of-time';
    case 'soulFrequency':
      return 'old-lantern';
    default:
      return 'scroll-unfurled';
  }
}

/** Plain, pre-formatted snapshot of the state for the UI. Rebuilt every render frame. */
export function buildView(state: GameState) {
  const n = state.settings.notation;
  const fmt = (x: Decimal | number) => formatNumber(x, n);
  const bones = state.resources.bones;
  const lifetime = state.stats.lifetimeBones;
  const buyAmount: BuyAmount = isUnlocked(state, 'bulkBuy') ? state.settings.buyAmount : 1;
  const d = state.descent;
  const boss = isBossFloor(d.floor);
  const maxHp = enemyMaxHp(d.floor);
  const foe = foeFor(d.floor, d.killsOnFloor);

  let lockedShown = 0;
  const minions = MINIONS.map((m) => {
    const owned = ownedCount(state, m.id);
    const revealed = minionVisible(state, m.id);
    const preview = !revealed && lockedShown++ < PREVIEW_LOCKED;
    const count = purchaseCount(state, m.id, buyAmount);
    const shownCount = Math.max(1, count);
    const cost = purchaseCost(state, m.id, shownCount);
    const unlockAt = m.baseCost * 0.4;
    const sealed = !minionAvailable(state, m.id);
    const deepest = Math.max(state.prestige.bestFloor, d.maxFloor);
    return {
      id: m.id,
      icon: m.icon,
      name: m.name,
      description: m.description,
      trait: m.trait ?? null,
      /** 'open' = buyable row, 'preview' = locked but named, 'hidden' = "???". */
      status: revealed ? ('open' as const) : preview ? ('preview' as const) : ('hidden' as const),
      unlockText: sealed ? `Defeat the guardian of floor ${(m.requiresFloor ?? 1) - 1}` : `Earn ${fmt(unlockAt)} Bones in total`,
      unlockRatio: sealed
        ? Math.min(1, deepest / (m.requiresFloor ?? 1))
        : Math.min(1, lifetime.toNumber() / unlockAt),
      owned,
      buyCount: shownCount,
      cost: fmt(cost),
      baseCost: fmt(m.baseCost),
      affordable: count > 0 && bones.gte(cost),
      dpsEach: fmt(unitDps(state, m.id)),
      dpsTotal: fmt(minionDps(state, m.id)),
      nextMilestone: nextMilestone(owned, MINION_MILESTONES),
    };
  });

  let gwLockedShown = 0;
  const graveworks = GRAVEWORKS.map((g) => {
    const e = state.crypt.graveworks[g.id]!;
    const revealed = graveworksVisible(state, g.id);
    const preview = !revealed && gwLockedShown++ < PREVIEW_LOCKED;
    const count = graveworksPurchaseCount(state, g.id, buyAmount);
    const shownCount = Math.max(1, count);
    const cost = graveworksPurchaseCost(state, g.id, shownCount);
    const owned = graveworksOwned(state, g.id);
    const cycle = cycleSeconds(state, g.id);
    const unlockAt = g.baseCost * 0.4;
    return {
      id: g.id,
      icon: g.icon,
      name: g.name,
      description: g.description,
      status: revealed ? ('open' as const) : preview ? ('preview' as const) : ('hidden' as const),
      unlockText: `Earn ${fmt(unlockAt)} Bones in total`,
      unlockRatio: Math.min(1, lifetime.toNumber() / unlockAt),
      owned,
      buyCount: shownCount,
      cost: fmt(cost),
      baseCost: fmt(g.baseCost),
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
    icon: upgradeIcon(u),
    name: u.name,
    description: u.description,
    flavor: u.flavor,
    cost: fmt(u.cost),
    affordable: bones.gte(u.cost),
  }));

  const lockedUpgrades = upcomingUpgrades(state, 3).map(({ def, progress }) => ({
    id: def.id,
    icon: upgradeIcon(def),
    name: def.name,
    description: def.description,
    requirement: progress.text,
    ratio: progress.ratio,
  }));

  // Depth track for the current layer: one segment per guardian.
  const layer = layerForFloor(d.floor);
  const layerEnd = layer.toFloor ?? Math.max(d.maxFloor, layer.fromFloor + 99);
  const guardians: { floor: number; name: string; icon: IconName; defeated: boolean; current: boolean }[] = [];
  for (let f = Math.ceil(layer.fromFloor / 10) * 10; f <= layerEnd; f += 10) {
    const g = bossFor(f);
    guardians.push({ floor: f, name: g.name, icon: g.icon, defeated: d.maxFloor > f, current: d.floor === f });
  }
  const span = layerEnd - layer.fromFloor + 1;
  const nextGuardianFloor = boss ? d.floor : Math.ceil(d.floor / 10) * 10;
  const nextGuardian = bossFor(nextGuardianFloor);

  const goals = upcomingUnlocks(state, 3).map(({ id, progress }) => ({
    id,
    goal: UNLOCKS.find((u) => u.id === id)?.goal ?? id,
    requirement: progress.text,
    ratio: progress.ratio,
  }));

  const BUFF_ICONS: Record<BuffId, IconName> = {
    soulFrenzy: 'soul',
    bloodMoon: 'evil-moon',
    raiseLegion: 'rally-the-troops',
    ossuaryRite: 'skeleton-inside',
    bloodRite: 'bleeding-heart',
    plagueWind: 'poison-cloud',
    rot: 'poison-bottle',
    pestilence: 'poison-gas',
    curseOfFrailty: 'cursed-star',
    eclipse: 'moon-orbit',
  };
  const buffs = (Object.keys(state.events.buffs) as BuffId[]).map((id) => ({
    id,
    icon: BUFF_ICONS[id],
    name: BUFFS[id].name,
    description: BUFFS[id].description,
    timeLeft: Math.ceil(state.events.buffs[id] ?? 0),
  }));

  const cryptUnlock = UNLOCKS.find((u) => u.id === 'crypt')!;

  return {
    bones: fmt(bones.floor()),
    income: fmt(totalIncome(state)),
    dps: fmt(armyDps(state)),
    bossDps: fmt(armyDps(state, true)),
    clickDamage: fmt(clickDamage(state)),
    layerName: layer.name,
    layerNumber: layerNumber(d.floor),
    hazard: layer.hazard,
    hazardKind: layer.modifier.kind,
    /** 0 when research, relics or a coven cancel the hazard entirely, 1 at full strength. */
    hazardStrength: layer.modifier.kind === 'none' ? 0 : hazardFactor(state, layer.modifier.kind),
    /** Percent of max HP the current enemy heals per second (0 when none). */
    regenPercent: Math.round(regenRate(state) * 1000) / 10,
    floor: d.floor,
    maxFloor: d.maxFloor,
    killsOnFloor: d.killsOnFloor,
    killsPerFloor: killsForFloor(d.floor),
    enemyName: foe.name,
    enemyIcon: foe.icon,
    /** Changes whenever a new enemy appears (drives the spawn animation). */
    enemyKey: `${d.floor}:${d.killsOnFloor}:${state.stats.totalKills}`,
    isBoss: boss,
    bossTimeLeft: Math.max(0, d.bossTimeLeft),
    bossTimerPercent: boss ? Math.max(0, Math.min(100, (d.bossTimeLeft / bossTimerSeconds(state)) * 100)) : 0,
    autoAdvance: d.autoAdvance,
    canChallenge: !d.autoAdvance,
    enemyHp: fmt(d.enemyHp.ceil()),
    enemyMaxHp: fmt(maxHp.ceil()),
    hpPercent: Math.max(0, Math.min(100, d.enemyHp.div(maxHp).toNumber() * 100)),
    depth: {
      from: layer.fromFloor,
      to: layerEnd,
      reachedPercent: Math.max(0, Math.min(100, ((d.maxFloor - layer.fromFloor + 1) / span) * 100)),
      currentPercent: Math.max(0, Math.min(100, ((d.floor - layer.fromFloor + 0.5) / span) * 100)),
      guardians,
      nextGuardian: { floor: nextGuardianFloor, name: nextGuardian.name, icon: nextGuardian.icon },
    },
    minions,
    graveworks,
    upgrades,
    lockedUpgrades,
    goals,
    sealed: SEALED_FEATURES,
    buffs,
    soul: state.events.soul,
    log: state.log as readonly LogEntry[],
    cryptUnlocked: isUnlocked(state, 'crypt'),
    cryptUnlock: describeCondition(state, cryptUnlock.condition),
    bulkBuyUnlocked: isUnlocked(state, 'bulkBuy'),
    depthBonus: depthBonus(state).toFixed(2),
    buyAmount,
    notation: n,
    relics: buildRelics(state),
    grimoire: buildGrimoire(state),
    phylactery: buildPhylactery(state),
    elites: buildElites(state),
    library: buildLibrary(state),
    feats: buildFeats(state),
    covens: buildCovens(state),
    autoBuyOwned: hasPact(state, 'autoRaise'),
    autoBuy: state.prestige.autoBuy,
    shardsEarned: state.prestige.shardsEarned,
    stats: {
      playTime: formatDuration(state.meta.playTimeSeconds),
      lastSavedAt: state.meta.lastSavedAt,
      lifetimeBones: fmt(lifetime.floor()),
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
