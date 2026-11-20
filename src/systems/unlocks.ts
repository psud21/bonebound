import type { GameState } from '../engine/state';
import { UNLOCKS } from '../content/story';
import { conditionMet } from './conditions';
import { addLog } from './log';

/** Checks every not-yet-unlocked feature. Returns the ids that unlocked just now. */
export function checkUnlocks(state: GameState): string[] {
  const fresh: string[] = [];
  for (const u of UNLOCKS) {
    if (state.unlocks[u.id]) continue;
    if (!conditionMet(state, u.condition)) continue;
    state.unlocks[u.id] = true;
    addLog(state, 'story', u.text);
    fresh.push(u.id);
  }
  return fresh;
}

export function isUnlocked(state: GameState, id: string): boolean {
  return state.unlocks[id] === true;
}
