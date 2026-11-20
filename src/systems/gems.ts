import { chance, pick } from '../engine/rng';
import type { GameState, Item } from '../engine/state';
import {
  ELITE_GEM_MULT,
  GEMS,
  GEMS_TO_COMBINE,
  GEM_DROPS,
  GEM_TYPES,
  MAX_GEM_TIER,
  SOCKETS,
  gemKey,
  gemName,
  gemTierForFloor,
  gemTierValue,
  parseGem,
  type GemType,
} from '../content/gems';
import { addLog } from './log';

export function gemCount(state: GameState, key: string): number {
  return state.loot.gems[key] ?? 0;
}

export function addGem(state: GameState, key: string, count = 1): void {
  if (!parseGem(key) || count <= 0) return;
  state.loot.gems[key] = gemCount(state, key) + count;
}

function takeGem(state: GameState, key: string): boolean {
  const n = gemCount(state, key);
  if (n <= 0) return false;
  if (n === 1) delete state.loot.gems[key];
  else state.loot.gems[key] = n - 1;
  return true;
}

/** Stats one gem adds. */
export function gemStats(key: string, mult = 1): Record<string, number> {
  const g = parseGem(key);
  if (!g) return {};
  const value = gemTierValue(g.tier) * mult;
  const out: Record<string, number> = {};
  for (const [stat, per] of Object.entries(GEMS[g.type].stats)) out[stat] = per * value;
  return out;
}

export function gemDescription(key: string): string {
  const g = parseGem(key);
  if (!g) return '';
  // The headline number is the first stat's actual value (a Diamond splits its power).
  const per = Object.values(GEMS[g.type].stats)[0] ?? 1;
  return GEMS[g.type].text.replace('{v}', String(Math.round(gemTierValue(g.tier) * per)));
}

/** Combines three gems of one type and tier into one of the next tier. */
export function combineGems(state: GameState, type: GemType, tier: number): boolean {
  if (tier >= MAX_GEM_TIER) return false;
  const key = gemKey(type, tier);
  if (gemCount(state, key) < GEMS_TO_COMBINE) return false;
  state.loot.gems[key] = gemCount(state, key) - GEMS_TO_COMBINE;
  if (state.loot.gems[key] === 0) delete state.loot.gems[key];
  addGem(state, gemKey(type, tier + 1));
  return true;
}

/** Combines everything that can be combined, lowest tier first. Returns how many combines happened. */
export function combineAll(state: GameState): number {
  let n = 0;
  for (let tier = 1; tier < MAX_GEM_TIER; tier++) {
    for (const type of GEM_TYPES) while (combineGems(state, type, tier)) n++;
  }
  return n;
}

export function socketCount(item: Item): number {
  return SOCKETS[item.rarity];
}

function findItem(state: GameState, id: number): { item: Item; replace: (next: Item) => void } | null {
  const index = state.loot.inventory.findIndex((i) => i.id === id);
  if (index >= 0) return { item: state.loot.inventory[index]!, replace: (next) => (state.loot.inventory[index] = next) };
  for (const [slot, item] of Object.entries(state.loot.equipped)) {
    if (item?.id === id) return { item, replace: (next) => (state.loot.equipped = { ...state.loot.equipped, [slot]: next }) };
  }
  return null;
}

/** Puts a loose gem into an item's free socket. */
export function socketGem(state: GameState, itemId: number, key: string): boolean {
  const found = findItem(state, itemId);
  if (!found || found.item.gems.length >= socketCount(found.item) || !takeGem(state, key)) return false;
  found.replace({ ...found.item, gems: [...found.item.gems, key] });
  return true;
}

/** Takes a gem back out of an item, unharmed. */
export function unsocketGem(state: GameState, itemId: number, index: number): boolean {
  const found = findItem(state, itemId);
  const key = found?.item.gems[index];
  if (!found || !key) return false;
  found.replace({ ...found.item, gems: found.item.gems.filter((_, i) => i !== index) });
  addGem(state, key);
  return true;
}

/** Gives an Elite a gem to carry (it counts double). Any gem it held goes back to the bag. */
export function setEliteGem(state: GameState, eliteId: string, key: string | null): boolean {
  if (!(eliteId in state.army.eliteGems)) return false;
  if (key !== null && !takeGem(state, key)) return false;
  const previous = state.army.eliteGems[eliteId];
  if (previous) addGem(state, previous);
  state.army.eliteGems = { ...state.army.eliteGems, [eliteId]: key };
  return true;
}

/** Stats from gems carried by Elites. */
export function eliteGemStats(state: GameState): Record<string, number> {
  const out: Record<string, number> = {};
  for (const key of Object.values(state.army.eliteGems)) {
    if (!key) continue;
    for (const [stat, v] of Object.entries(gemStats(key, ELITE_GEM_MULT))) out[stat] = (out[stat] ?? 0) + v;
  }
  return out;
}

export function gemsUnlocked(state: GameState): boolean {
  return Math.max(state.prestige.bestFloor, state.descent.maxFloor) >= GEM_DROPS.MIN_FLOOR || Object.keys(state.loot.gems).length > 0;
}

/** A guardian may leave a gem. Returns its key, if any. */
export function rollGemDrop(state: GameState, floor: number): string | null {
  if (floor < GEM_DROPS.MIN_FLOOR || !chance(state.rng, GEM_DROPS.GUARDIAN_CHANCE)) return null;
  const key = gemKey(pick(state.rng, GEM_TYPES), gemTierForFloor(floor));
  addGem(state, key);
  state.stats.gemsFound += 1;
  return key;
}

/** Gives several random gems of one tier (Rift rewards). */
export function grantGems(state: GameState, count: number, tier: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const key = gemKey(pick(state.rng, GEM_TYPES), Math.max(1, Math.min(MAX_GEM_TIER, tier)));
    addGem(state, key);
    out.push(key);
  }
  state.stats.gemsFound += count;
  if (count > 0) addLog(state, 'loot', `Gems: ${out.map(gemName).join(', ')}.`);
  return out;
}
