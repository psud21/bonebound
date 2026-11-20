import { chance, nextFloat, nextInt, pick, weightedPick, type RngState } from '../engine/rng';
import type { AutoSalvage, GameState, Item, ItemAffix } from '../engine/state';
import {
  BOSS_RARITY_WEIGHTS,
  DROP_CHANCE,
  INVENTORY_SIZE,
  ITEM_KINDS,
  KIND_INFO,
  LEGENDARIES,
  MAX_DROPS_PER_BATCH,
  NORMAL_RARITY_WEIGHTS,
  RARITIES,
  RARITY_INFO,
  SETS,
  SET_MIN_FLOOR,
  STATS,
  STATS_BY_ID,
  kindForSlot,
  type EquipSlot,
  type ItemKind,
  type Rarity,
} from '../content/loot';
import { gearStat, itemScore } from './gear';
import { researchEffects } from './library';
import { curseLootPercent } from './curses';
import { addGem } from './gems';
import { addLog } from './log';

/** Item find from gear and research, as a multiplier. */
export function lootFindMultiplier(state: GameState): number {
  const research = researchEffects(state, 'lootFind').reduce((s, e) => s + e.percent, 0);
  return 1 + (gearStat(state, 'lootFind') + research + curseLootPercent(state)) / 100;
}

/** Legendaries and set pieces are never salvaged automatically. */
export function isPrecious(item: Item): boolean {
  return item.legendary !== null || item.set !== null;
}

export function lootEnabled(state: GameState): boolean {
  return state.descent.maxFloor >= 10 || state.prestige.rebirths > 0;
}

function rollAffix(rng: RngState, exclude: Set<string>): ItemAffix {
  const options = STATS.filter((s) => !exclude.has(s.id));
  const stat = pick(rng, options).id;
  exclude.add(stat);
  return { stat, roll: 0.7 + nextFloat(rng) * 0.6 };
}

function rollAffixes(rng: RngState, rarity: Rarity, implicitStat: string): ItemAffix[] {
  const [min, max] = RARITY_INFO[rarity].affixes;
  const count = nextInt(rng, min, max);
  const used = new Set([implicitStat]);
  return Array.from({ length: count }, () => rollAffix(rng, used));
}

function itemName(rng: RngState, kind: ItemKind, rarity: Rarity, affixes: ItemAffix[]): string {
  const base = pick(rng, KIND_INFO[kind].bases);
  if (rarity === 'common') return `Worn ${base}`;
  const top = affixes[0] ? STATS_BY_ID[affixes[0].stat] : undefined;
  return top ? `${base} ${top.suffix}` : base;
}

/** Creates a random item. Pass `kind` or `rarity` to force them. */
export function generateItem(state: GameState, level: number, rarity: Rarity, kind?: ItemKind): Item {
  const rng = state.rng;
  let legendary: string | null = null;
  let set: string | null = null;
  let setName: string | null = null;
  let itemKind = kind ?? pick(rng, ITEM_KINDS);
  if (rarity === 'legendary') {
    const deepEnough = LEGENDARIES.filter((l) => (l.minFloor ?? 0) <= level);
    const options = deepEnough.filter((l) => !kind || l.kind === kind);
    const def = pick(rng, options.length > 0 ? options : deepEnough.length > 0 ? deepEnough : LEGENDARIES);
    legendary = def.id;
    itemKind = def.kind;
  } else if (rarity === 'set') {
    const options = SETS.filter((s) => !kind || s.pieces[kind]);
    const def = pick(rng, options.length > 0 ? options : SETS);
    const kinds = Object.keys(def.pieces) as ItemKind[];
    itemKind = kind && def.pieces[kind] ? kind : pick(rng, kinds);
    set = def.id;
    setName = def.pieces[itemKind]!;
  }
  const implicitStat =
    KIND_INFO[itemKind].implicit === 'random' ? pick(rng, STATS).id : KIND_INFO[itemKind].implicit;
  const implicit: ItemAffix = { stat: implicitStat, roll: 0.85 + nextFloat(rng) * 0.3 };
  const affixes = rollAffixes(rng, rarity, implicitStat);
  const name = legendary
    ? LEGENDARIES.find((l) => l.id === legendary)!.name
    : (setName ?? itemName(rng, itemKind, rarity, affixes));
  return { id: state.loot.nextId++, kind: itemKind, rarity, level, name, implicit, affixes, legendary, set, gems: [], empowered: 0 };
}

function rollRarity(state: GameState, boss: boolean, floor: number): Rarity {
  const weights = boss ? BOSS_RARITY_WEIGHTS : NORMAL_RARITY_WEIGHTS;
  const find = lootFindMultiplier(state);
  // Item find shifts weight from common toward better rarities. Sets only drop deep.
  return weightedPick(
    state.rng,
    RARITIES.filter((r) => r !== 'set' || floor >= SET_MIN_FLOOR).map((r) => ({
      value: r,
      weight: r === 'common' ? weights[r] : weights[r] * find,
    })),
  );
}

const RANK: Readonly<Record<Rarity, number>> = { common: 0, magic: 1, rare: 2, set: 3, legendary: 4 };

function shouldAutoSalvage(setting: AutoSalvage, rarity: Rarity): boolean {
  return setting !== 'none' && RANK[rarity] <= RANK[setting];
}

/** Adds a found item: auto-salvages it if the filter says so or the bag is full. */
export function receiveItem(state: GameState, item: Item): 'kept' | 'salvaged' {
  state.stats.itemsFound += 1;
  if (item.legendary) state.stats.legendariesFound += 1;
  const full = state.loot.inventory.length >= INVENTORY_SIZE;
  if (!isPrecious(item) && (shouldAutoSalvage(state.loot.autoSalvage, item.rarity) || full)) {
    state.loot.dust += dustValue(item);
    return 'salvaged';
  }
  if (full) {
    // Never destroy a legendary or set piece: salvage the weakest ordinary item to make room.
    const weakest = [...state.loot.inventory].filter((i) => !isPrecious(i)).sort((a, b) => itemScore(a) - itemScore(b))[0];
    if (weakest) salvageItem(state, weakest.id);
    else {
      state.loot.dust += dustValue(item);
      return 'salvaged';
    }
  }
  state.loot.inventory.push(item);
  state.loot.unseen += 1;
  if (item.rarity === 'legendary') addLog(state, 'loot', `A legendary relic: ${item.name}!`);
  if (item.rarity === 'set') addLog(state, 'loot', `A set relic: ${item.name}!`);
  return 'kept';
}

/** Called for each batch of kills. Bosses always drop one item. */
export function rollDrops(state: GameState, floor: number, kills: number, boss: boolean): Item[] {
  if (!lootEnabled(state) || kills <= 0) return [];
  const dropped: Item[] = [];
  if (boss) {
    const item = generateItem(state, floor, rollRarity(state, true, floor));
    receiveItem(state, item);
    dropped.push(item);
    return dropped;
  }
  const p = DROP_CHANCE * lootFindMultiplier(state);
  const expected = kills * p;
  let count = Math.floor(expected);
  if (chance(state.rng, expected - count)) count += 1;
  count = Math.min(count, MAX_DROPS_PER_BATCH);
  for (let i = 0; i < count; i++) {
    const item = generateItem(state, floor, rollRarity(state, false, floor));
    receiveItem(state, item);
    dropped.push(item);
  }
  return dropped;
}

export function dustValue(item: Item): number {
  return Math.round(RARITY_INFO[item.rarity].dust * (1 + item.level / 20));
}

function findInventory(state: GameState, id: number): number {
  return state.loot.inventory.findIndex((i) => i.id === id);
}

export function salvageItem(state: GameState, id: number): boolean {
  const index = findInventory(state, id);
  if (index < 0) return false;
  const [item] = state.loot.inventory.splice(index, 1);
  state.loot.dust += dustValue(item!);
  for (const key of item!.gems ?? []) addGem(state, key);
  return true;
}

/** Salvages every unequipped, non-legendary item at or below a rarity. Returns how many. */
export function salvageAll(state: GameState, upTo: Rarity): number {
  const keep: Item[] = [];
  let count = 0;
  for (const item of state.loot.inventory) {
    if (!isPrecious(item) && RANK[item.rarity] <= RANK[upTo]) {
      state.loot.dust += dustValue(item);
      for (const key of item.gems ?? []) addGem(state, key);
      count++;
    } else keep.push(item);
  }
  state.loot.inventory = keep;
  return count;
}

/** Slots an item of this kind can go in. */
export function slotsFor(kind: ItemKind): EquipSlot[] {
  return kind === 'ring' ? ['ring1', 'ring2'] : [kind];
}

/** Which slot equipping would use: an empty one if possible, else the weaker ring. */
export function targetSlot(state: GameState, item: Item): EquipSlot {
  const slots = slotsFor(item.kind);
  const empty = slots.find((s) => !state.loot.equipped[s]);
  if (empty) return empty;
  return slots.reduce((weakest, s) =>
    itemScore(state.loot.equipped[s]!) < itemScore(state.loot.equipped[weakest]!) ? s : weakest,
  );
}

export function equipItem(state: GameState, id: number, slot?: EquipSlot): boolean {
  const index = findInventory(state, id);
  if (index < 0) return false;
  const item = state.loot.inventory[index]!;
  const target = slot ?? targetSlot(state, item);
  if (kindForSlot(target) !== item.kind) return false;
  const previous = state.loot.equipped[target];
  state.loot.inventory.splice(index, 1);
  if (previous) state.loot.inventory.push(previous);
  state.loot.equipped = { ...state.loot.equipped, [target]: item };
  return true;
}

export function unequip(state: GameState, slot: EquipSlot): boolean {
  const item = state.loot.equipped[slot];
  if (!item || state.loot.inventory.length >= INVENTORY_SIZE) return false;
  const next = { ...state.loot.equipped };
  delete next[slot];
  state.loot.equipped = next;
  state.loot.inventory.push(item);
  return true;
}

/** Equips the highest-scoring item for every slot. Returns how many items changed. */
export function equipBest(state: GameState): number {
  let changed = 0;
  for (const kind of ITEM_KINDS) {
    for (const slot of slotsFor(kind)) {
      const current = state.loot.equipped[slot];
      const candidates = state.loot.inventory.filter((i) => i.kind === kind);
      const best = candidates.sort((a, b) => itemScore(b) - itemScore(a))[0];
      if (best && (!current || itemScore(best) > itemScore(current))) {
        equipItem(state, best.id, slot);
        changed++;
      }
    }
  }
  return changed;
}

/** How much better (positive) or worse an inventory item is than what it would replace. */
export function scoreDelta(state: GameState, item: Item): number {
  const current = state.loot.equipped[targetSlot(state, item)];
  return itemScore(item) - (current ? itemScore(current) : 0);
}

function locate(state: GameState, id: number): { item: Item; replace: (next: Item) => void } | null {
  const index = findInventory(state, id);
  if (index >= 0) {
    return { item: state.loot.inventory[index]!, replace: (next) => (state.loot.inventory[index] = next) };
  }
  for (const [slot, item] of Object.entries(state.loot.equipped)) {
    if (item?.id === id) {
      return { item, replace: (next) => (state.loot.equipped = { ...state.loot.equipped, [slot]: next }) };
    }
  }
  return null;
}

export function reforgeCost(item: Item): number {
  return Math.round(RARITY_INFO[item.rarity].dust * 4 * (1 + item.level / 25));
}

/** Rerolls an item's extra stats (not its main stat or legendary power). */
export function reforge(state: GameState, id: number): boolean {
  const found = locate(state, id);
  if (!found || found.item.rarity === 'common') return false;
  const cost = reforgeCost(found.item);
  if (state.loot.dust < cost) return false;
  state.loot.dust -= cost;
  const affixes = rollAffixes(state.rng, found.item.rarity, found.item.implicit.stat);
  found.replace({ ...found.item, affixes });
  return true;
}

export function empowerCost(state: GameState, item: Item): number {
  const gain = Math.max(0, state.prestige.bestFloor - item.level);
  return Math.round(gain * RARITY_INFO[item.rarity].dust * 0.5);
}

/** Raises an item's level to the deepest floor ever reached. */
export function empower(state: GameState, id: number): boolean {
  const found = locate(state, id);
  if (!found || found.item.level >= state.prestige.bestFloor) return false;
  const cost = empowerCost(state, found.item);
  if (state.loot.dust < cost) return false;
  state.loot.dust -= cost;
  found.replace({ ...found.item, level: state.prestige.bestFloor, empowered: found.item.empowered + 1 });
  return true;
}
