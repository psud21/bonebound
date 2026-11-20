import { fromJson, mergeDefaults, toJson } from './serialize';
import { migrate, type RawSave } from './migrations';
import { createInitialState, type BuyAmount, type GameState } from './state';
import type { Notation } from './format';

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
  if (!Number.isFinite(d.killsOnFloor) || d.killsOnFloor < 0) d.killsOnFloor = 0;
  for (const [id, entry] of Object.entries(state.army.minions)) {
    if (typeof entry !== 'object' || entry === null) {
      state.army.minions[id] = { owned: 0 };
    } else if (!Number.isFinite(entry.owned) || entry.owned < 0) {
      entry.owned = 0;
    } else {
      entry.owned = Math.floor(entry.owned);
    }
  }
  return state;
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
