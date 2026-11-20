import { fromJson, mergeDefaults, toJson } from './serialize';
import { migrate, type RawSave } from './migrations';
import { createInitialState, type BuyAmount, type GameState, type Item, type ItemAffix } from './state';
import { EQUIP_SLOTS, ITEM_KINDS, RARITIES, kindForSlot, type EquipSlot, type ItemKind, type Rarity } from '../content/loot';
import { PACT_BY_ID } from '../content/pact';
import { SPELLS_BY_ID, type SpellId } from '../content/spells';
import type { Notation } from './format';
import { enemyMaxHp, killsForFloor } from '../systems/descent';
import { bossTimerSeconds } from '../systems/modifiers';

const SAVE_PREFIX = 'BB1:';
export const SAVE_KEY = 'bonebound.save';
export const BACKUP_KEY = 'bonebound.save.backup';

export class SaveError extends Error {}

/** Minimal storage interface so tests can pass a fake and the browser passes localStorage. */
export type SaveStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function toBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function fromBase64(b64: string): string {
  const binary = atob(b64);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/** Serializes the game into a portable string (used for storage and export). */
export function encodeSave(state: GameState): string {
  return SAVE_PREFIX + toBase64(toJson(state));
}

/** Parses, migrates and fills defaults. Throws SaveError if the string isn't a valid save. */
export function decodeSave(text: string): GameState {
  const trimmed = text.trim();
  if (!trimmed.startsWith(SAVE_PREFIX)) throw new SaveError('Not a Bonebound save.');
  let raw: unknown;
  try {
    raw = fromJson(fromBase64(trimmed.slice(SAVE_PREFIX.length)));
  } catch {
    throw new SaveError('Save data is corrupted.');
  }
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new SaveError('Save data is corrupted.');
  }
  const migrated = migrate(raw as RawSave);
  const defaults = createInitialState(Date.now());
  return sanitize(mergeDefaults(defaults, migrated), migrated);
}

const BUY_AMOUNTS: readonly BuyAmount[] = [1, 10, 100, 'max'];
const NOTATIONS: readonly Notation[] = ['short', 'scientific', 'engineering'];

/** Fixes fields that mergeDefaults can't check by type alone (unions, ranges). */
function sanitize(state: GameState, raw: RawSave): GameState {
  const rawSettings = (raw.settings ?? {}) as Record<string, unknown>;
  const buy = rawSettings.buyAmount as BuyAmount;
  state.settings.buyAmount = BUY_AMOUNTS.includes(buy) ? buy : 1;
  if (!NOTATIONS.includes(state.settings.notation)) state.settings.notation = 'short';

  const d = state.descent;
  if (!Number.isFinite(d.floor) || d.floor < 1) d.floor = 1;
  d.floor = Math.floor(d.floor);
  d.maxFloor = Math.max(d.floor, Number.isFinite(d.maxFloor) ? Math.floor(d.maxFloor) : 1);
  if (!Number.isFinite(d.killsOnFloor) || d.killsOnFloor < 0 || d.killsOnFloor >= killsForFloor(d.floor)) {
    d.killsOnFloor = 0;
  }
  const maxHp = enemyMaxHp(d.floor);
  const rawDescent = (raw.descent ?? {}) as Record<string, unknown>;
  if (!('enemyHp' in rawDescent) || d.enemyHp.lte(0) || d.enemyHp.gt(maxHp)) d.enemyHp = maxHp;
  if (!Number.isFinite(d.bossTimeLeft) || d.bossTimeLeft <= 0) d.bossTimeLeft = bossTimerSeconds(state);

  for (const [id, entry] of Object.entries(state.army.minions)) {
    if (typeof entry !== 'object' || entry === null) {
      state.army.minions[id] = { owned: 0 };
    } else {
      entry.owned = cleanCount(entry.owned);
    }
  }

  for (const [id, entry] of Object.entries(state.crypt.graveworks)) {
    if (typeof entry !== 'object' || entry === null) {
      state.crypt.graveworks[id] = { owned: 0, progress: 0, running: false, warden: false };
      continue;
    }
    entry.owned = cleanCount(entry.owned);
    if (!Number.isFinite(entry.progress) || entry.progress < 0 || entry.progress >= 1) entry.progress = 0;
    entry.running = entry.running === true;
    entry.warden = entry.warden === true;
  }

  state.upgrades.purchased = Array.isArray(state.upgrades.purchased)
    ? [...new Set(state.upgrades.purchased.filter((id): id is string => typeof id === 'string'))]
    : [];

  state.log = Array.isArray(state.log)
    ? state.log.filter((e) => e && typeof e.text === 'string' && typeof e.at === 'number')
    : [];

  const ev = state.events;
  const soul = ev.soul as unknown;
  if (soul !== null) {
    const s = soul as Record<string, unknown>;
    const valid = typeof s === 'object' && [s.timeLeft, s.x, s.y].every((v) => typeof v === 'number' && Number.isFinite(v));
    if (!valid) ev.soul = null;
  }
  if (!Number.isFinite(ev.soulCooldown) || ev.soulCooldown < 0) ev.soulCooldown = 0;
  for (const [id, left] of Object.entries(ev.buffs)) {
    if (typeof left !== 'number' || !Number.isFinite(left) || left <= 0) delete ev.buffs[id as keyof typeof ev.buffs];
  }

  for (const [id, value] of Object.entries(state.unlocks)) {
    if (value !== true) delete state.unlocks[id];
  }

  // Loot: drop anything that isn't a well-formed item.
  const loot = state.loot;
  loot.inventory = Array.isArray(loot.inventory) ? loot.inventory.filter(isItem) : [];
  const equipped: Partial<Record<EquipSlot, Item>> = {};
  for (const slot of EQUIP_SLOTS) {
    const item = (loot.equipped as Record<string, unknown>)[slot];
    if (isItem(item) && item.kind === kindForSlot(slot)) equipped[slot] = item;
  }
  loot.equipped = equipped;
  const maxId = Math.max(0, ...loot.inventory.map((i) => i.id), ...Object.values(equipped).map((i) => i!.id));
  loot.nextId = Math.max(cleanCount(loot.nextId), maxId + 1);
  loot.dust = cleanCount(loot.dust);
  loot.unseen = cleanCount(loot.unseen);
  if (!['none', ...RARITIES].includes(loot.autoSalvage)) loot.autoSalvage = 'none';

  // Magic
  const magic = state.magic;
  if (!Number.isFinite(magic.essence) || magic.essence < 0) magic.essence = 0;
  for (const [id, left] of Object.entries(magic.cooldowns)) {
    if (!SPELLS_BY_ID[id as SpellId] || typeof left !== 'number' || !Number.isFinite(left) || left <= 0) {
      delete magic.cooldowns[id as SpellId];
    }
  }
  for (const school of Object.values(magic.schools)) {
    school.level = cleanCount(school.level);
    if (!Number.isFinite(school.xp) || school.xp < 0) school.xp = 0;
  }
  magic.autoCast = magic.autoCast === true;

  // Prestige
  const p = state.prestige;
  p.shards = cleanCount(p.shards);
  p.shardsEarned = Math.max(cleanCount(p.shardsEarned), p.shards);
  p.rebirths = cleanCount(p.rebirths);
  p.pact = Array.isArray(p.pact) ? [...new Set(p.pact.filter((id): id is string => typeof id === 'string' && !!PACT_BY_ID[id]))] : [];
  p.autoBuy = p.autoBuy === true;
  p.bestFloor = Math.max(cleanCount(p.bestFloor), d.maxFloor, 1);
  if (!Number.isFinite(p.runStartedAt) || p.runStartedAt < 0) p.runStartedAt = 0;
  return state;
}

function isItem(value: unknown): value is Item {
  if (typeof value !== 'object' || value === null) return false;
  const i = value as Record<string, unknown>;
  const affixOk = (a: unknown) =>
    typeof a === 'object' && a !== null && typeof (a as ItemAffix).stat === 'string' && typeof (a as ItemAffix).roll === 'number';
  return (
    typeof i.id === 'number' &&
    ITEM_KINDS.includes(i.kind as ItemKind) &&
    RARITIES.includes(i.rarity as Rarity) &&
    typeof i.level === 'number' &&
    typeof i.name === 'string' &&
    affixOk(i.implicit) &&
    Array.isArray(i.affixes) &&
    i.affixes.every(affixOk) &&
    (i.legendary === null || typeof i.legendary === 'string') &&
    (typeof i.empowered === 'number' || i.empowered === undefined)
  );
}

function cleanCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

export type LoadSource = 'main' | 'backup' | 'new';

export interface LoadResult {
  state: GameState;
  source: LoadSource;
  /** Set when a save existed but couldn't be read. */
  error?: string;
}

export class SaveStore {
  constructor(private readonly storage: SaveStorage) {}

  /** Writes the save, keeping the previous one as a backup. Returns false if storage failed. */
  save(state: GameState, now: number = Date.now()): boolean {
    state.meta.lastSavedAt = now;
    try {
      const encoded = encodeSave(state);
      const previous = this.storage.getItem(SAVE_KEY);
      if (previous) this.storage.setItem(BACKUP_KEY, previous);
      this.storage.setItem(SAVE_KEY, encoded);
      return true;
    } catch {
      return false;
    }
  }

  load(): LoadResult {
    const errors: string[] = [];
    for (const [key, source] of [
      [SAVE_KEY, 'main'],
      [BACKUP_KEY, 'backup'],
    ] as const) {
      let text: string | null = null;
      try {
        text = this.storage.getItem(key);
      } catch {
        errors.push('Browser storage is unavailable.');
        break;
      }
      if (!text) continue;
      try {
        return { state: decodeSave(text), source, error: errors[0] };
      } catch (e) {
        errors.push(e instanceof Error ? e.message : String(e));
      }
    }
    return { state: createInitialState(), source: 'new', error: errors[0] };
  }

  clear(): void {
    try {
      this.storage.removeItem(SAVE_KEY);
      this.storage.removeItem(BACKUP_KEY);
    } catch {
      // Nothing to do: storage is unavailable.
    }
  }
}
