import { SAVE_VERSION } from './state';

/** A raw, not-yet-validated save object. */
export type RawSave = Record<string, unknown> & { version?: number };

/**
 * Migrations keyed by the version they upgrade FROM.
 * New fields with defaults don't need a migration (mergeDefaults fills them);
 * use migrations for renames, moved data and changed meanings.
 * Never edit a migration after release; add a new one.
 */
export const MIGRATIONS: Readonly<Record<number, (save: RawSave) => RawSave>> = {
  // v1 → v2 (M1): crypt, upgrades, events, unlocks, log and boss fields are new, so
  // defaults fill them. Enemy HP scaling changed, so drop the stored enemy HP;
  // sanitize() then sets it to the full HP of the current floor.
  1: (s) => {
    const descent = { ...((s.descent ?? {}) as Record<string, unknown>) };
    delete descent.enemyHp;
    return { ...s, descent };
  },
  // v3 → v4 (M3): Corpses, Elites, the Library, feats, covens and set relics are new;
  // defaults fill them and sanitize() normalizes old items (set: null).
  // v4 → v5 (M4): gems, sockets, Rifts, Curses and Lichdom are new; defaults fill them
  // and sanitize() gives old items an empty gem list.
  // v5 → v6 (M5): sound, hint and motion settings and the tutorial are new. Players who
  // already have a save are past the basics, so they start with the early hints marked seen.
  5: (s) => {
    const tutorial = { seen: ['siphon', 'firstMinion', 'crypt', 'startCycle', 'bulkBuy'] };
    return { ...s, tutorial };
  },
};

export class SaveVersionError extends Error {}

export function migrate(
  save: RawSave,
  migrations: Readonly<Record<number, (save: RawSave) => RawSave>> = MIGRATIONS,
  targetVersion: number = SAVE_VERSION,
): RawSave {
  let current = save;
  let version = typeof current.version === 'number' ? current.version : 0;
  if (version > targetVersion) {
    throw new SaveVersionError(
      `This save is from a newer version of the game (v${version}; this build reads up to v${targetVersion}).`,
    );
  }
  while (version < targetVersion) {
    const step = migrations[version];
    if (step) {
      current = step(current);
    }
    version += 1;
    current = { ...current, version };
  }
  return current;
}
