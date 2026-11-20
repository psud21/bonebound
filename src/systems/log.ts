import type { GameState, LogKind } from '../engine/state';
import { BALANCE } from '../content/balance';

/** Adds a Chronicle entry (newest first), keeping the log bounded. */
export function addLog(state: GameState, kind: LogKind, text: string, at: number = Date.now()): void {
  state.log.unshift({ at, kind, text });
  if (state.log.length > BALANCE.LOG_LIMIT) state.log.length = BALANCE.LOG_LIMIT;
}
