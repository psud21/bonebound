import { formatDuration, formatNumber } from '../engine/format';
import type { GameState, Item } from '../engine/state';
import { EQUIP_SLOTS, KIND_INFO, LEGENDARIES_BY_ID, RARITY_INFO, SETS, SETS_BY_ID, STATS_BY_ID, kindForSlot } from '../content/loot';
import { PACT_NODES, PRESTIGE, shardsForFloor } from '../content/pact';
import { SCHOOLS, SCHOOL_IDS, SPELLS, schoolXpForLevel } from '../content/spells';
import { ELITES } from '../content/elites';
import { BRANCHES, RESEARCH, RESEARCH_BY_ID, type ResearchBranch } from '../content/research';
import { FEATS } from '../content/achievements';
import { COVENS, COVENS_BY_ID, COVEN_UNLOCK_REBIRTHS } from '../content/covens';
import { canRaiseElite, corpsesUnlocked, eliteCost, eliteEffectText, eliteLevel, eliteUnlocked } from '../systems/elites';
import { canStartResearch, libraryUnlocked, researchDone, researchSlots, researchSpeed } from '../systems/library';
import { featMultiplier, hasFeat } from '../systems/feats';
import { covensUnlocked } from '../systems/covens';
import type { Decimal } from '../engine/bignum';
import { GEMS, GEMS_TO_COMBINE, MAX_GEM_TIER, SOCKETS, gemName, parseGem } from '../content/gems';
import { CURSES, CURSES_BY_ID, CURSE_UNLOCK_REBIRTHS, LICHDOM, LICH_POWERS, RIFT, darkXpForLevel } from '../content/endgame';
import { gemDescription, gemsUnlocked } from '../systems/gems';
import { canOpenRift, riftEnemyHp, riftFloorFor, riftMasteryMultiplier, riftSeconds, riftsUnlocked } from '../systems/rifts';
import { activeCurses, cursesUnlocked } from '../systems/curses';
import {
  canAscend,
  canBuyLichPower,
  darkLevelMultiplier,
  dreadMultiplier,
  hasLichPower,
  lichdomVisible,
  pendingDread,
} from '../systems/lichdom';
import { affixValue, effectiveLevel, itemAffixes, itemScore, setCounts } from '../systems/gear';
import { dustValue, empowerCost, lootEnabled, reforgeCost, scoreDelta, targetSlot } from '../systems/loot';
import {
  autoCastEnabled,
  essenceMax,
  essenceRegen,
  magicUnlocked,
  schoolLevel,
  schoolUnlocked,
  spellCooldown,
  spellCost,
  spellKnown,
  spellPower,
  spellReady,
} from '../systems/magic';
import { canBuyPact, canRebirth, hasPact, pendingShards, phylacteryVisible, shardMultiplier } from '../systems/prestige';
import type { IconName } from './icons.generated';

function statLine(stat: string, value: number): string {
  const def = STATS_BY_ID[stat];
  return def ? def.text.replace('{v}', value.toFixed(def.decimals)) : `${stat} ${value}`;
}

export function itemView(state: GameState, item: Item, equippedSlot: string | null) {
  const legendary = item.legendary ? LEGENDARIES_BY_ID[item.legendary] : undefined;
  const delta = equippedSlot ? 0 : scoreDelta(state, item);
  return {
    id: item.id,
    name: item.name,
    rarity: item.rarity,
    rarityLabel: RARITY_INFO[item.rarity].label,
    kindLabel: KIND_INFO[item.kind].label,
    icon: KIND_INFO[item.kind].icon as IconName,
    level: item.level,
    /** Depth caps how strong gear is: the level it performs at right now. */
    effectiveLevel: effectiveLevel(item, state.descent.maxFloor),
    empowered: item.empowered,
    lines: itemAffixes(item).map((a, i) => ({ text: statLine(a.stat, affixValue(a, item.level, item.rarity)), implicit: i === 0 })),
    power: legendary?.power ?? null,
    setName: item.set ? (SETS_BY_ID[item.set]?.name ?? null) : null,
    sockets: itemSockets(item),
    score: Math.round(itemScore(item)),
    /** Positive = upgrade over what it would replace. */
    delta: Math.round(delta),
    equippedSlot,
    wouldReplace: equippedSlot ? null : targetSlot(state, item),
    dust: dustValue(item),
    reforgeCost: reforgeCost(item),
    canReforge: item.rarity !== 'common' && state.loot.dust >= reforgeCost(item),
    empowerCost: empowerCost(state, item),
    canEmpower: item.level < state.prestige.bestFloor && state.loot.dust >= empowerCost(state, item),
    empowerTo: state.prestige.bestFloor,
  };
}

export type ItemView = ReturnType<typeof itemView>;

export function buildRelics(state: GameState) {
  const slots = EQUIP_SLOTS.map((slot) => {
    const item = state.loot.equipped[slot];
    const kind = kindForSlot(slot);
    return {
      slot,
      label: KIND_INFO[kind].label,
      icon: KIND_INFO[kind].icon as IconName,
      item: item ? itemView(state, item, slot) : null,
    };
  });
  const inventory = state.loot.inventory
    .map((i) => itemView(state, i, null))
    .sort((a, b) => b.delta - a.delta || b.score - a.score);
  return {
    visible: lootEnabled(state) || state.loot.inventory.length > 0 || Object.keys(state.loot.equipped).length > 0,
    slots,
    inventory,
    capacity: 30,
    dust: formatNumber(state.loot.dust, state.settings.notation),
    autoSalvage: state.loot.autoSalvage,
    unseen: state.loot.unseen,
    upgradesAvailable: inventory.filter((i) => i.delta > 0).length,
    sets: buildSets(state),
  };
}

/** Set bonuses for every set with at least one piece worn. */
function buildSets(state: GameState) {
  const counts = setCounts(state);
  return SETS.filter((set) => (counts[set.id] ?? 0) > 0).map((set) => ({
    id: set.id,
    name: set.name,
    worn: counts[set.id] ?? 0,
    pieces: Object.keys(set.pieces).length,
    bonuses: set.bonuses.map((b) => ({ pieces: b.pieces, text: b.text, active: (counts[set.id] ?? 0) >= b.pieces })),
  }));
}

export function buildGrimoire(state: GameState) {
  const spells = SPELLS.map((s) => {
    const cooldown = spellCooldown(state, s.id);
    const left = Math.max(0, state.magic.cooldowns[s.id] ?? 0);
    return {
      id: s.id,
      school: s.school,
      name: s.name,
      description: s.description,
      icon: s.icon,
      cost: spellCost(state, s.id),
      cooldown: Math.round(cooldown),
      cooldownLeft: left,
      cooldownPercent: Math.max(0, Math.min(100, (left / cooldown) * 100)),
      known: spellKnown(state, s.id),
      unlockLevel: s.unlockLevel,
      ready: spellReady(state, s.id),
      power: Math.round(spellPower(state, s.id) * 100),
    };
  });
  const schools = SCHOOL_IDS.map((id) => {
    const level = schoolLevel(state, id);
    const xp = state.magic.schools[id]?.xp ?? 0;
    const needed = schoolXpForLevel(level);
    return {
      ...SCHOOLS[id],
      unlocked: schoolUnlocked(state, id),
      level,
      xp: Math.floor(xp),
      needed,
      percent: Math.min(100, (xp / needed) * 100),
      spells: spells.filter((sp) => sp.school === id),
    };
  });
  return {
    visible: magicUnlocked(state),
    essence: Math.floor(state.magic.essence),
    essenceMax: essenceMax(state),
    essencePercent: Math.min(100, (state.magic.essence / essenceMax(state)) * 100),
    regen: essenceRegen(state).toFixed(1),
    schools,
    /** Kept for the spell bar: every spell, in school order. */
    spells,
    autoCastOwned: hasPact(state, 'autoCast'),
    autoCast: autoCastEnabled(state),
  };
}

export function buildPhylactery(state: GameState) {
  const p = state.prestige;
  const maxFloor = state.descent.maxFloor;
  const gain = pendingShards(state);
  // The next floor that would raise the payout.
  let nextFloor = Math.max(maxFloor + 1, PRESTIGE.MIN_FLOOR);
  while (shardsForFloor(nextFloor) <= gain && nextFloor < maxFloor + 500) nextFloor++;
  const runSeconds = state.meta.playTimeSeconds - p.runStartedAt;
  const nodes = PACT_NODES.map((n) => ({
    id: n.id,
    name: n.name,
    description: n.description,
    icon: n.icon,
    cost: n.cost,
    tier: n.tier,
    owned: hasPact(state, n.id),
    affordable: canBuyPact(state, n.id),
    locked: !n.requires.every((r) => hasPact(state, r)),
    requires: n.requires.map((r) => PACT_NODES.find((x) => x.id === r)?.name ?? r),
  }));
  const tiers = [...new Set(nodes.map((n) => n.tier))].sort().map((t) => nodes.filter((n) => n.tier === t));
  return {
    visible: phylacteryVisible(state),
    shards: p.shards,
    shardsEarned: p.shardsEarned,
    bonusPercent: Math.round((shardMultiplier(state) - 1) * 100),
    rebirths: p.rebirths,
    bestFloor: p.bestFloor,
    maxFloor,
    minFloor: PRESTIGE.MIN_FLOOR,
    gain,
    canRebirth: canRebirth(state),
    nextFloor,
    nextGain: shardsForFloor(nextFloor),
    runTime: formatDuration(runSeconds),
    tiers,
    affordableNodes: nodes.filter((n) => n.affordable).length,
  };
}

export function buildElites(state: GameState) {
  const fmt = (x: number) => formatNumber(x, state.settings.notation);
  return {
    visible: corpsesUnlocked(state),
    corpses: fmt(Math.floor(state.resources.corpses)),
    list: ELITES.map((e) => {
      const unlocked = eliteUnlocked(state, e.id);
      return {
        id: e.id,
        name: e.name,
        description: e.description,
        icon: e.icon,
        level: eliteLevel(state, e.id),
        unlocked,
        unlockFloor: e.unlockFloor,
        effect: eliteEffectText(state, e.id),
        cost: fmt(eliteCost(state, e.id)),
        affordable: canRaiseElite(state, e.id),
      };
    }),
  };
}

export function buildLibrary(state: GameState) {
  const lib = state.library;
  const slots = researchSlots(state);
  const speed = researchSpeed(state);
  const branches = (Object.keys(BRANCHES) as ResearchBranch[]).map((b) => ({
    id: b,
    ...BRANCHES[b],
    projects: RESEARCH.filter((r) => r.branch === b).map((r) => {
      const active = lib.active.find((a) => a.id === r.id);
      const done = researchDone(state, r.id);
      return {
        id: r.id,
        name: r.name,
        description: r.description,
        cost: r.cost,
        duration: formatDuration(r.seconds / speed),
        done,
        active: !!active,
        remaining: active ? formatDuration(Math.max(0, active.remaining / speed)) : '',
        percent: active ? Math.max(0, Math.min(100, (1 - active.remaining / r.seconds) * 100)) : done ? 100 : 0,
        locked: !done && !active && !r.requires.every((q) => researchDone(state, q)),
        requires: r.requires.map((q) => RESEARCH_BY_ID[q]?.name ?? q),
        canStart: canStartResearch(state, r.id),
      };
    }),
  }));
  return {
    visible: libraryUnlocked(state),
    lore: Math.floor(lib.lore),
    loreEarned: Math.floor(lib.loreEarned),
    slots,
    busy: lib.active.length,
    completed: lib.completed.length,
    total: RESEARCH.length,
    branches,
    startable: branches.reduce((n, b) => n + b.projects.filter((p) => p.canStart).length, 0),
  };
}

export function buildFeats(state: GameState) {
  const list = FEATS.map((f) => ({
    id: f.id,
    name: f.name,
    description: f.description,
    icon: f.icon,
    earned: hasFeat(state, f.id),
  }));
  const n = state.settings.notation;
  return {
    visible: state.feats.length > 0,
    earned: state.feats.length,
    total: FEATS.length,
    bonusPercent: Math.round((featMultiplier(state) - 1) * 100),
    list,
    stats: [
      { label: 'Time played', value: formatDuration(state.meta.playTimeSeconds) },
      { label: 'Deepest floor', value: String(Math.max(state.prestige.bestFloor, state.descent.maxFloor)) },
      { label: 'Bones earned', value: formatNumber(state.stats.lifetimeBones.floor(), n) },
      { label: 'Enemies slain', value: formatNumber(state.stats.totalKills, n) },
      { label: 'Guardians defeated', value: formatNumber(state.stats.bossesDefeated, n) },
      { label: 'Siphons', value: formatNumber(state.stats.totalClicks, n) },
      { label: 'Wandering Souls caught', value: formatNumber(state.stats.soulsCaught, n) },
      { label: 'Relics found', value: formatNumber(state.stats.itemsFound, n) },
      { label: 'Legendaries found', value: formatNumber(state.stats.legendariesFound, n) },
      { label: 'Spells cast', value: formatNumber(state.stats.spellsCast, n) },
      { label: 'Corpses gathered', value: formatNumber(Math.floor(state.stats.corpsesEarned), n) },
      { label: 'Rebirths', value: String(state.prestige.rebirths) },
      { label: 'Gems found', value: formatNumber(state.stats.gemsFound, n) },
      { label: 'Rifts opened', value: String(state.stats.riftsRun) },
      { label: 'Best Rift depth', value: String(state.rift.best) },
      { label: 'Ascensions', value: String(state.lich.ascensions) },
      { label: 'Dark Level', value: String(state.lich.darkLevel) },
    ],
  };
}

export function buildCovens(state: GameState) {
  const sworn = state.prestige.coven;
  return {
    unlocked: covensUnlocked(state),
    sworn,
    swornName: sworn ? (COVENS_BY_ID[sworn]?.name ?? null) : null,
    rebirthsNeeded: COVEN_UNLOCK_REBIRTHS,
    list: COVENS.map((c) => ({ ...c, chosen: c.id === sworn })),
  };
}

export function buildGems(state: GameState) {
  const bag = Object.entries(state.loot.gems)
    .map(([key, count]) => {
      const g = parseGem(key)!;
      return {
        key,
        count,
        type: g.type,
        tier: g.tier,
        name: gemName(key),
        icon: GEMS[g.type].icon,
        text: gemDescription(key),
        canCombine: count >= GEMS_TO_COMBINE && g.tier < MAX_GEM_TIER,
      };
    })
    .sort((a, b) => b.tier - a.tier || a.type.localeCompare(b.type));
  return {
    visible: gemsUnlocked(state),
    bag,
    combinable: bag.some((g) => g.canCombine),
    eliteSlots: ELITES.map((e) => {
      const key = state.army.eliteGems[e.id] ?? null;
      return { id: e.id, name: e.name, gem: key, gemName: key ? gemName(key) : null, gemIcon: key ? GEMS[parseGem(key)!.type].icon : null };
    }),
  };
}

/** Sockets on one item, for the item card. */
export function itemSockets(item: Item) {
  return {
    total: SOCKETS[item.rarity],
    gems: item.gems.map((key) => ({ key, name: gemName(key), icon: GEMS[parseGem(key)?.type ?? 'ruby'].icon, text: gemDescription(key) })),
  };
}

export function buildRift(state: GameState) {
  const r = state.rift;
  const fmt = (x: Decimal) => formatNumber(x, state.settings.notation);
  const maxHp = riftEnemyHp(state, r.depth);
  return {
    visible: riftsUnlocked(state),
    keys: r.keys,
    best: r.best,
    masteryPercent: Math.round((riftMasteryMultiplier(state) - 1) * 100),
    canOpen: canOpenRift(state),
    active: r.active,
    depth: r.depth,
    timeLeft: Math.max(0, r.timeLeft),
    timePercent: r.active ? Math.max(0, Math.min(100, (r.timeLeft / riftSeconds(state)) * 100)) : 0,
    seconds: riftSeconds(state),
    enemyHp: fmt(r.enemyHp.ceil()),
    enemyMaxHp: fmt(maxHp.ceil()),
    hpPercent: Math.max(0, Math.min(100, r.enemyHp.div(maxHp).toNumber() * 100)),
    enemyFloor: riftFloorFor(r.depth),
    legendaryDepth: RIFT.LEGENDARY_DEPTH,
    runs: state.stats.riftsRun,
  };
}

export function buildCurses(state: GameState) {
  return {
    unlocked: cursesUnlocked(state),
    rebirthsNeeded: CURSE_UNLOCK_REBIRTHS,
    active: activeCurses(state).map((c) => c.name),
    list: CURSES.map((c) => ({
      ...c,
      bonusPercent: Math.round(c.shardBonus * 100),
      next: state.prestige.nextCurses.includes(c.id),
      active: state.prestige.curses.includes(c.id),
    })),
    nextBonusPercent: Math.round(
      state.prestige.nextCurses.reduce((s, id) => s + (CURSES_BY_ID[id]?.shardBonus ?? 0), 0) * 100,
    ),
  };
}

export function buildLichdom(state: GameState) {
  const l = state.lich;
  const needed = darkXpForLevel(l.darkLevel);
  return {
    visible: lichdomVisible(state),
    isLich: l.ascensions > 0,
    dread: l.dread,
    dreadEarned: l.dreadEarned,
    ascensions: l.ascensions,
    dreadPercent: Math.round((dreadMultiplier(state) - 1) * 100),
    pending: pendingDread(state),
    canAscend: canAscend(state),
    minFloor: LICHDOM.MIN_FLOOR,
    deepest: Math.max(state.prestige.bestFloor, state.descent.maxFloor),
    shardsEarned: state.prestige.shardsEarned,
    nextDreadAt: Math.ceil(400 * (pendingDread(state) + 1) ** 2),
    darkLevel: l.darkLevel,
    darkXp: Math.floor(l.darkXp),
    darkNeeded: needed,
    darkPercent: Math.min(100, (l.darkXp / needed) * 100),
    darkBonusPercent: Math.round((darkLevelMultiplier(state) - 1) * 100),
    powers: LICH_POWERS.map((p) => ({
      ...p,
      owned: hasLichPower(state, p.id),
      affordable: canBuyLichPower(state, p.id),
      locked: !p.requires.every((r) => hasLichPower(state, r)),
      requiresNames: p.requires.map((r) => LICH_POWERS.find((x) => x.id === r)?.name ?? r),
    })),
    affordable: LICH_POWERS.filter((p) => canBuyLichPower(state, p.id)).length,
  };
}
