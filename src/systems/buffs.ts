import type { GameState } from '../engine/state';
import type { BuffId } from '../content/events';

export function buffActive(state: GameState, id: BuffId): boolean {
  return (state.events.buffs[id] ?? 0) > 0;
}
