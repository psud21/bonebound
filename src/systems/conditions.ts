import type { GameState } from '../engine/state';
import type { UnlockDef } from '../content/story';

export type AnyCondition = UnlockDef['condition'];

export function conditionMet(state: GameState, c: AnyCondition): boolean {
  switch (c.kind) {
    case 'start':
      return true;
    case 'lifetimeBones':
      return state.stats.lifetimeBones.gte(c.amount);
    case 'minionOwned':
      return (state.army.minions[c.id]?.owned ?? 0) >= c.count;
    case 'graveworksOwned':
      return (state.crypt.graveworks[c.id]?.owned ?? 0) >= c.count;
    case 'maxFloor':
      return state.descent.maxFloor >= c.floor;
    case 'clicks':
      return state.stats.totalClicks >= c.count;
    case 'rebirths':
      return state.prestige.rebirths >= c.count;
    case 'unlocked':
      return state.unlocks[c.id] === true;
  }
}
