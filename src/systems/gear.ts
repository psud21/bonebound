import type { GameState, Item, ItemAffix } from '../engine/state';
import { LEGENDARIES_BY_ID, RARITY_INFO, SETS, STATS_BY_ID, type LegendaryEffect, type Rarity } from '../content/loot';

/** The number an affix contributes, e.g. 23 for "+23% minion damage". */
export function affixValue(affix: ItemAffix, level: number, rarity: Rarity): number {
  const def = STATS_BY_ID[affix.stat];
  if (!def) return 0;
  const raw = (def.base + def.perLevel * level) * RARITY_INFO[rarity].mult * affix.roll;
  const f = 10 ** def.decimals;
  return Math.round(raw * f) / f;
}

export function itemAffixes(item: Item): ItemAffix[] {
  return [item.implicit, ...item.affixes];
}

/** Relics only reach their full power at depth: an item counts as at most this many floors below or at your deepest floor this run. */
export const DEPTH_LEEWAY = 10;

/** The level an item actually performs at right now. */
export function effectiveLevel(item: Item, maxFloor: number): number {
  return Math.min(item.level, maxFloor + DEPTH_LEEWAY);
}

/** Sum of each stat across one item, at a given level (defaults to the item's own). */
export function itemStats(item: Item, level: number = item.level): Record<string, number> {
  const out: Record<string, number> = {};
  for (const a of itemAffixes(item)) out[a.stat] = (out[a.stat] ?? 0) + affixValue(a, level, item.rarity);
  return out;
}

/** A single number for "how good is this item", used for comparing and Equip Best. */
export function itemScore(item: Item): number {
  let score = 0;
  for (const [stat, value] of Object.entries(itemStats(item))) score += value * (STATS_BY_ID[stat]?.weight ?? 0);
  if (item.legendary) score += 40 + item.level;
  // Set pieces are worth more than their stats, because of the set bonuses.
  if (item.set) score += 25 + item.level * 0.5;
  return score;
}

const statCache = new WeakMap<object, { maxFloor: number; stats: Record<string, number> }>();
const legendaryCache = new WeakMap<object, LegendaryEffect[]>();

/**
 * Totals of every stat on equipped gear, at effective level. Cached per `equipped`
 * object and depth, so code that changes equipment must replace `state.loot.equipped`.
 */
export function gearStats(state: GameState): Record<string, number> {
  const eq = state.loot.equipped;
  const maxFloor = state.descent.maxFloor;
  const hit = statCache.get(eq);
  if (hit && hit.maxFloor === maxFloor) return hit.stats;
  const stats: Record<string, number> = {};
  for (const item of Object.values(eq)) {
    if (!item) continue;
    for (const [stat, v] of Object.entries(itemStats(item, effectiveLevel(item, maxFloor)))) {
      stats[stat] = (stats[stat] ?? 0) + v;
    }
  }
  statCache.set(eq, { maxFloor, stats });
  return stats;
}

export function gearStat(state: GameState, stat: string): number {
  return gearStats(state)[stat] ?? 0;
}

/** Pieces of each set currently worn. */
export function setCounts(state: GameState): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of Object.values(state.loot.equipped)) {
    if (item?.set) counts[item.set] = (counts[item.set] ?? 0) + 1;
  }
  return counts;
}

/** Most pieces of any single set worn. */
export function maxSetPieces(state: GameState): number {
  return Math.max(0, ...Object.values(setCounts(state)));
}

/** Legendary powers and active set bonuses on equipped gear. */
export function legendaryEffects(state: GameState): LegendaryEffect[] {
  const eq = state.loot.equipped;
  let cached = legendaryCache.get(eq);
  if (!cached) {
    cached = [];
    for (const item of Object.values(eq)) {
      const def = item?.legendary ? LEGENDARIES_BY_ID[item.legendary] : undefined;
      if (def) cached.push(def.effect);
    }
    const counts = setCounts(state);
    for (const set of SETS) {
      for (const bonus of set.bonuses) if ((counts[set.id] ?? 0) >= bonus.pieces) cached.push(...bonus.effects);
    }
    legendaryCache.set(eq, cached);
  }
  return cached;
}

export function hasLegendary<K extends LegendaryEffect['kind']>(
  state: GameState,
  kind: K,
): Extract<LegendaryEffect, { kind: K }>[] {
  return legendaryEffects(state).filter((e): e is Extract<LegendaryEffect, { kind: K }> => e.kind === kind);
}
