import { D, Decimal } from '../engine/bignum';
import type { GameState } from '../engine/state';
import { RIFT } from '../content/endgame';
import { gemTierForFloor } from '../content/gems';
import { floorBaseHp } from './descent';
import { grantGems } from './gems';
import { lichEffects } from './lichdom';
import { addLog } from './log';
import { generateItem, receiveItem } from './loot';

export function riftsUnlocked(state: GameState): boolean {
  return Math.max(state.prestige.bestFloor, state.descent.maxFloor) >= RIFT.UNLOCK_FLOOR || state.rift.best > 0;
}

/** The main-descent floor whose guardian a Rift depth matches. Fixed, so Rift depth measures real power. */
export function riftFloorFor(depth: number): number {
  return RIFT.BASE_FLOOR + RIFT.FLOORS_PER_DEPTH * depth;
}

/** HP of the Rift enemy at a depth. (`state` is kept for call sites; difficulty doesn't depend on it.) */
export function riftEnemyHp(_state: GameState, depth: number): Decimal {
  return floorBaseHp(riftFloorFor(depth)).mul(RIFT.HP_MULT);
}

export function riftSeconds(state: GameState): number {
  return RIFT.SECONDS + lichEffects(state, 'riftTime').reduce((s, e) => s + e.seconds, 0);
}

/** Army damage bonus from the deepest Rift ever cleared. */
export function riftMasteryMultiplier(state: GameState): number {
  return 1 + (RIFT.MASTERY_PERCENT / 100) * state.rift.best;
}

export function canOpenRift(state: GameState): boolean {
  return riftsUnlocked(state) && !state.rift.active && state.rift.keys > 0;
}

/** Spends a Rift Key and opens a Rift. The army fights there until it closes. */
export function openRift(state: GameState): boolean {
  if (!canOpenRift(state)) return false;
  const r = state.rift;
  r.keys -= 1;
  r.active = true;
  r.depth = 1;
  r.timeLeft = riftSeconds(state);
  r.enemyHp = riftEnemyHp(state, 1);
  state.stats.riftsRun += 1;
  addLog(state, 'event', 'You tear open an Abyssal Rift. Ten minutes. Go as deep as you can.');
  return true;
}

/** Damage dealt inside the Rift. Returns Rift floors cleared. */
export function damageRift(state: GameState, amount: Decimal): number {
  const r = state.rift;
  if (!r.active) return 0;
  let remaining = D(amount);
  let cleared = 0;
  for (let guard = 0; guard < 1000 && remaining.gte(r.enemyHp); guard++) {
    remaining = remaining.sub(r.enemyHp);
    r.depth += 1;
    cleared += 1;
    r.enemyHp = riftEnemyHp(state, r.depth);
  }
  if (remaining.gt(0)) r.enemyHp = Decimal.max(r.enemyHp.sub(remaining), 0);
  return cleared;
}

export interface RiftRewards {
  depth: number;
  gems: string[];
  dust: number;
  legendary: string | null;
}

/** Closes the Rift and pays out by depth (floors cleared). */
export function closeRift(state: GameState): RiftRewards | null {
  const r = state.rift;
  if (!r.active) return null;
  const depth = r.depth - 1;
  r.active = false;
  const newBest = depth > r.best;
  r.best = Math.max(r.best, depth);
  const gems = depth > 0 ? grantGems(state, 1 + Math.floor(depth / 4), gemTierForFloor(riftFloorFor(depth))) : [];
  const dust = depth * 25;
  state.loot.dust += dust;
  let legendary: string | null = null;
  if (depth >= RIFT.LEGENDARY_DEPTH) {
    const item = generateItem(state, riftFloorFor(depth), 'legendary');
    receiveItem(state, item);
    legendary = item.name;
  }
  addLog(
    state,
    'event',
    `The Rift closes at depth ${depth}${newBest ? ' (a new best)' : ''}. ${dust} Bone Dust${gems.length ? `, ${gems.length} gems` : ''}${legendary ? `, and ${legendary}` : ''}.`,
  );
  return { depth, gems, dust, legendary };
}

/** Counts the Rift timer down. */
export function updateRift(state: GameState, dt: number): RiftRewards | null {
  const r = state.rift;
  if (!r.active) return null;
  r.timeLeft -= dt;
  return r.timeLeft <= 0 ? closeRift(state) : null;
}

/** A guardian's first fall this run, deep enough, leaves a Rift Key. */
export function maybeGrantKey(state: GameState, floor: number): void {
  if (floor >= RIFT.KEY_FLOOR) state.rift.keys += 1;
}
