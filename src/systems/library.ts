import { chance } from '../engine/rng';
import type { GameState } from '../engine/state';
import { LIBRARY, RESEARCH, RESEARCH_BY_ID, type ResearchEffect } from '../content/research';
import { addLog } from './log';
import { pactEffects } from './prestige';
import { lichEffects } from './lichdom';

export function libraryUnlocked(state: GameState): boolean {
  return state.unlocks.library === true;
}

export function researchDone(state: GameState, id: string): boolean {
  return state.library.completed.includes(id);
}

export function researchEffects<K extends ResearchEffect['kind']>(state: GameState, kind: K): Extract<ResearchEffect, { kind: K }>[] {
  const out: Extract<ResearchEffect, { kind: K }>[] = [];
  for (const id of state.library.completed) {
    const e = RESEARCH_BY_ID[id]?.effect;
    if (e && e.kind === kind) out.push(e as Extract<ResearchEffect, { kind: K }>);
  }
  return out;
}

type MultKind = Extract<ResearchEffect, { mult: number }>['kind'];

/** Product of every completed research multiplier of one kind (1 if none). */
export function researchProduct(state: GameState, kind: MultKind): number {
  return researchEffects(state, kind).reduce((m, e) => m * (e as { mult: number }).mult, 1);
}

export function researchSlots(state: GameState): number {
  return 1 + researchEffects(state, 'slots').reduce((s, e) => s + e.extra, 0);
}

export function researchSpeed(state: GameState): number {
  return (
    pactEffects(state, 'researchSpeed').reduce((m, e) => m * e.mult, 1) *
    lichEffects(state, 'researchSpeed').reduce((m, e) => m * e.mult, 1)
  );
}

export function isResearching(state: GameState, id: string): boolean {
  return state.library.active.some((a) => a.id === id);
}

export function researchAvailable(state: GameState, id: string): boolean {
  const def = RESEARCH_BY_ID[id];
  return !!def && !researchDone(state, id) && !isResearching(state, id) && def.requires.every((r) => researchDone(state, r));
}

export function canStartResearch(state: GameState, id: string): boolean {
  return (
    libraryUnlocked(state) &&
    researchAvailable(state, id) &&
    state.library.active.length < researchSlots(state) &&
    state.library.lore >= RESEARCH_BY_ID[id]!.cost
  );
}

export function startResearch(state: GameState, id: string): boolean {
  if (!canStartResearch(state, id)) return false;
  const def = RESEARCH_BY_ID[id]!;
  state.library.lore -= def.cost;
  state.library.active.push({ id, remaining: def.seconds });
  return true;
}

/** Stops a project and refunds its Lore. Progress is lost. */
export function cancelResearch(state: GameState, id: string): boolean {
  const index = state.library.active.findIndex((a) => a.id === id);
  if (index < 0) return false;
  state.library.active.splice(index, 1);
  state.library.lore += RESEARCH_BY_ID[id]?.cost ?? 0;
  return true;
}

/** Advances research by real time (runs offline too). */
export function updateLibrary(state: GameState, dt: number): void {
  const lib = state.library;
  if (lib.active.length === 0) return;
  const step = dt * researchSpeed(state);
  for (const a of lib.active) a.remaining -= step;
  const finished = lib.active.filter((a) => a.remaining <= 0);
  if (finished.length === 0) return;
  lib.active = lib.active.filter((a) => a.remaining > 0);
  for (const f of finished) {
    if (!lib.completed.includes(f.id)) lib.completed.push(f.id);
    addLog(state, 'event', `Research complete: ${RESEARCH_BY_ID[f.id]?.name ?? f.id}.`);
  }
}

export function loreMultiplier(state: GameState): number {
  return researchProduct(state, 'lore');
}

export function gainLore(state: GameState, amount: number): number {
  if (!libraryUnlocked(state) || amount <= 0) return 0;
  const gained = amount * loreMultiplier(state);
  state.library.lore += gained;
  state.library.loreEarned += gained;
  return gained;
}

/** Lore for a guardian's first defeat this run. */
export function guardianLore(floor: number): number {
  return Math.ceil(floor / LIBRARY.GUARDIAN_DIVISOR);
}

/** Tomes found among a batch of normal kills. Returns Lore gained. */
export function rollTomes(state: GameState, floor: number, kills: number): number {
  if (!libraryUnlocked(state) || kills <= 0) return 0;
  const expected = kills * LIBRARY.TOME_CHANCE;
  let count = Math.floor(expected);
  if (chance(state.rng, expected - count)) count += 1;
  count = Math.min(count, LIBRARY.MAX_TOMES_PER_BATCH);
  return count > 0 ? gainLore(state, count * Math.ceil(floor / LIBRARY.TOME_DIVISOR)) : 0;
}

/** Research projects in display order. */
export function allResearch() {
  return RESEARCH;
}
