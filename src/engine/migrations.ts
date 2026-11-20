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
