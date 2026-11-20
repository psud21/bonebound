import type { GameState } from '../engine/state';
import { CURSES_BY_ID, CURSE_LOOT_PERCENT, CURSE_UNLOCK_REBIRTHS, type CurseDef } from '../content/endgame';

export function cursesUnlocked(state: GameState): boolean {
  return state.prestige.rebirths >= CURSE_UNLOCK_REBIRTHS;
}

/** Curses on the current run. */
export function activeCurses(state: GameState): CurseDef[] {
  return state.prestige.curses.map((id) => CURSES_BY_ID[id]).filter((c): c is CurseDef => !!c);
}

export function curseEffects<K extends CurseDef['effect']['kind']>(state: GameState, kind: K): Extract<CurseDef['effect'], { kind: K }>[] {
  return activeCurses(state)
    .map((c) => c.effect)
    .filter((e): e is Extract<CurseDef['effect'], { kind: K }> => e.kind === kind);
}

/** Extra Soul Shards from this run's curses, as a multiplier. */
export function curseShardMultiplier(state: GameState): number {
  return 1 + activeCurses(state).reduce((s, c) => s + c.shardBonus, 0);
}

/** Extra item find from this run's curses, in percent. */
export function curseLootPercent(state: GameState): number {
  return activeCurses(state).length * CURSE_LOOT_PERCENT;
}

/** Toggles a curse for the next run (it takes effect at the next Rebirth). */
export function toggleNextCurse(state: GameState, id: string): boolean {
  if (!cursesUnlocked(state) || !CURSES_BY_ID[id]) return false;
  const next = state.prestige.nextCurses;
  state.prestige.nextCurses = next.includes(id) ? next.filter((c) => c !== id) : [...next, id];
  return true;
}
