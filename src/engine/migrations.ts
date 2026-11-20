import { SAVE_VERSION } from './state';

/** A raw, not-yet-validated save object. */
export type RawSave = Record<string, unknown> & { version?: number };

/**
 * Migrations keyed by the version they upgrade FROM.
 * Example for a future change:
 *   1: (s) => ({ ...s, version: 2, crypt: { graveworks: {} } }),
 * Never edit a migration after release; add a new one.
 */
export const MIGRATIONS: Readonly<Record<number, (save: RawSave) => RawSave>> = {};

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
