import type { GameState } from '../engine/state';
import { COVENS_BY_ID, COVEN_UNLOCK_REBIRTHS, type CovenEffects } from '../content/covens';
import { addLog } from './log';

export function covensUnlocked(state: GameState): boolean {
  return state.prestige.rebirths >= COVEN_UNLOCK_REBIRTHS;
}

const NONE: CovenEffects = {};

export function covenEffects(state: GameState): CovenEffects {
  const id = state.prestige.coven;
  return (id && COVENS_BY_ID[id]?.effects) || NONE;
}

/** Swears to a coven for the rest of this run. Only possible once per run. */
export function chooseCoven(state: GameState, id: string): boolean {
  if (!covensUnlocked(state) || state.prestige.coven || !COVENS_BY_ID[id]) return false;
  state.prestige.coven = id;
  addLog(state, 'story', `You swear yourself to ${COVENS_BY_ID[id]!.name} until your next death.`);
  return true;
}
