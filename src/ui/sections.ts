import { formatDuration, formatNumber } from '../engine/format';
import type { GameState, Item } from '../engine/state';
import { EQUIP_SLOTS, KIND_INFO, LEGENDARIES_BY_ID, RARITY_INFO, STATS_BY_ID, kindForSlot } from '../content/loot';
import { PACT_NODES, PRESTIGE, shardsForFloor } from '../content/pact';
import { SCHOOLS, SPELLS, schoolXpForLevel } from '../content/spells';
import { affixValue, effectiveLevel, itemAffixes, itemScore } from '../systems/gear';
import { dustValue, empowerCost, lootEnabled, reforgeCost, scoreDelta, targetSlot } from '../systems/loot';
import {
  autoCastEnabled,
  essenceMax,
  essenceRegen,
  magicUnlocked,
  schoolLevel,
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
  };
}

export function buildGrimoire(state: GameState) {
  const level = schoolLevel(state, 'bone');
  const xp = state.magic.schools.bone?.xp ?? 0;
  const needed = schoolXpForLevel(level);
  const spells = SPELLS.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    icon: s.icon,
    cost: s.cost,
    cooldown: s.cooldown,
    cooldownLeft: Math.max(0, state.magic.cooldowns[s.id] ?? 0),
    cooldownPercent: Math.max(0, Math.min(100, ((state.magic.cooldowns[s.id] ?? 0) / s.cooldown) * 100)),
    known: spellKnown(state, s.id),
    unlockLevel: s.unlockLevel,
    ready: spellReady(state, s.id),
    power: Math.round(spellPower(state, s.id) * 100),
  }));
  return {
    visible: magicUnlocked(state),
    essence: Math.floor(state.magic.essence),
    essenceMax: essenceMax(state),
    essencePercent: Math.min(100, (state.magic.essence / essenceMax(state)) * 100),
    regen: essenceRegen(state).toFixed(1),
    school: { ...SCHOOLS.bone, level, xp: Math.floor(xp), needed, percent: Math.min(100, (xp / needed) * 100) },
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
