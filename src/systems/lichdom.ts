import type { GameState } from '../engine/state';
import {
  LICHDOM,
  LICH_POWERS,
  LICH_POWERS_BY_ID,
  darkXpForFloor,
  darkXpForLevel,
  dreadForShards,
  type LichEffect,
} from '../content/endgame';
import { addLog } from './log';

export function isLich(state: GameState): boolean {
  return state.lich.ascensions > 0;
}

export function hasLichPower(state: GameState, id: string): boolean {
  return state.lich.powers.includes(id);
}

export function lichEffects<K extends LichEffect['kind']>(state: GameState, kind: K): Extract<LichEffect, { kind: K }>[] {
  const out: Extract<LichEffect, { kind: K }>[] = [];
  for (const id of state.lich.powers) {
    const e = LICH_POWERS_BY_ID[id]?.effect;
    if (e && e.kind === kind) out.push(e as Extract<LichEffect, { kind: K }>);
  }
  return out;
}

/** Dread ever earned boosts army damage and Bones. */
export function dreadMultiplier(state: GameState): number {
  return 1 + (LICHDOM.DREAD_POWER_PERCENT / 100) * state.lich.dreadEarned;
}

export function darkLevelMultiplier(state: GameState): number {
  return 1 + (LICHDOM.DARK_LEVEL_PERCENT / 100) * state.lich.darkLevel;
}

export function lichArmyMultiplier(state: GameState): number {
  return dreadMultiplier(state) * darkLevelMultiplier(state) * lichEffects(state, 'armyDamage').reduce((m, e) => m * e.mult, 1);
}

export function pendingDread(state: GameState): number {
  return dreadForShards(state.prestige.shardsEarned);
}

export function lichdomVisible(state: GameState): boolean {
  return isLich(state) || Math.max(state.prestige.bestFloor, state.descent.maxFloor) >= LICHDOM.MIN_FLOOR - 50;
}

export function canAscend(state: GameState): boolean {
  return Math.max(state.prestige.bestFloor, state.descent.maxFloor) >= LICHDOM.MIN_FLOOR && pendingDread(state) > 0;
}

export function canBuyLichPower(state: GameState, id: string): boolean {
  const def = LICH_POWERS_BY_ID[id];
  if (!def || hasLichPower(state, id)) return false;
  return def.requires.every((r) => hasLichPower(state, r)) && state.lich.dread >= def.cost;
}

export function buyLichPower(state: GameState, id: string): boolean {
  if (!canBuyLichPower(state, id)) return false;
  state.lich.dread -= LICH_POWERS_BY_ID[id]!.cost;
  state.lich.powers.push(id);
  return true;
}

/** Dark experience for reaching a new floor this run. Only Liches earn it. */
export function gainDarkXp(state: GameState, floor: number): void {
  if (!isLich(state)) return;
  const l = state.lich;
  l.darkXp += darkXpForFloor(floor);
  while (l.darkXp >= darkXpForLevel(l.darkLevel)) {
    l.darkXp -= darkXpForLevel(l.darkLevel);
    l.darkLevel += 1;
    if (l.darkLevel % 10 === 0) addLog(state, 'event', `Dark Level ${l.darkLevel}. The Abyss knows your name now.`);
  }
}

/** Lich powers in display order. */
export function lichPowers() {
  return LICH_POWERS;
}
