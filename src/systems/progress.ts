import type { GameState } from '../engine/state';
import { formatNumber } from '../engine/format';
import { GRAVEWORKS_BY_ID } from '../content/graveworks';
import { MINIONS_BY_ID } from '../content/minions';
import { UNLOCKS } from '../content/story';
import { UPGRADES, type UpgradeDef } from '../content/upgrades';
import { conditionMet, type AnyCondition } from './conditions';
import { isPurchased } from './upgrades';

export interface ConditionProgress {
  text: string;
  current: number;
  target: number;
  /** 0..1 */
  ratio: number;
}

/** Human-readable requirement plus how close the player is. */
export function describeCondition(state: GameState, c: AnyCondition): ConditionProgress {
  const n = state.settings.notation;
  const make = (text: string, current: number, target: number): ConditionProgress => ({
    text,
    current,
    target,
    ratio: target > 0 ? Math.max(0, Math.min(1, current / target)) : 1,
  });
  switch (c.kind) {
    case 'start':
      return make('Begin', 1, 1);
    case 'lifetimeBones':
      return make(
        `Earn ${formatNumber(c.amount, n)} Bones in total`,
        Math.min(state.stats.lifetimeBones.toNumber(), c.amount),
        c.amount,
      );
    case 'minionOwned':
      return make(
        `Own ${c.count} ${MINIONS_BY_ID[c.id]?.name ?? c.id}`,
        state.army.minions[c.id]?.owned ?? 0,
        c.count,
      );
    case 'graveworksOwned':
      return make(
        `Own ${c.count} ${GRAVEWORKS_BY_ID[c.id]?.name ?? c.id}`,
        state.crypt.graveworks[c.id]?.owned ?? 0,
        c.count,
      );
    case 'maxFloor':
      return make(`Reach floor ${c.floor}`, state.descent.maxFloor, c.floor);
    case 'clicks':
      return make(`Siphon ${c.count} times`, state.stats.totalClicks, c.count);
    case 'unlocked':
      return make(`Unlock ${c.id}`, state.unlocks[c.id] ? 1 : 0, 1);
  }
}

/** Upgrades not yet available, closest to unlocking first. */
export function upcomingUpgrades(state: GameState, limit: number): { def: UpgradeDef; progress: ConditionProgress }[] {
  return UPGRADES.filter((u) => !isPurchased(state, u.id) && !conditionMet(state, u.unlock))
    .map((def) => ({ def, progress: describeCondition(state, def.unlock) }))
    .sort((a, b) => b.progress.ratio - a.progress.ratio || a.def.cost - b.def.cost)
    .slice(0, limit);
}

/** Story unlocks still ahead, closest first. */
export function upcomingUnlocks(state: GameState, limit: number): { id: string; progress: ConditionProgress }[] {
  return UNLOCKS.filter((u) => !state.unlocks[u.id] && u.condition.kind !== 'start')
    .map((u) => ({ id: u.id, progress: describeCondition(state, u.condition) }))
    .sort((a, b) => b.progress.ratio - a.progress.ratio)
    .slice(0, limit);
}
