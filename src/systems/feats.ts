import type { GameState } from '../engine/state';
import { FEATS, FEAT_DAMAGE_PERCENT, type FeatCondition } from '../content/achievements';
import { SCHOOL_IDS } from '../content/spells';
import { totalEliteLevels } from './elites';
import { maxSetPieces } from './gear';
import { addLog } from './log';

export function featConditionMet(state: GameState, c: FeatCondition): boolean {
  switch (c.kind) {
    case 'bestFloor':
      return Math.max(state.prestige.bestFloor, state.descent.maxFloor) >= c.floor;
    case 'stat':
      return state.stats[c.stat] >= c.count;
    case 'lifetimeBones':
      return state.stats.lifetimeBones.gte(c.amount);
    case 'rebirths':
      return state.prestige.rebirths >= c.count;
    case 'schoolLevel': {
      const ids = c.school === 'any' ? SCHOOL_IDS : [c.school];
      return ids.some((id) => (state.magic.schools[id]?.level ?? 0) >= c.level);
    }
    case 'eliteLevels':
      return totalEliteLevels(state) >= c.count;
    case 'research':
      return state.library.completed.length >= c.count;
    case 'coven':
      return state.prestige.coven !== null;
    case 'setPieces':
      return maxSetPieces(state) >= c.count;
    case 'minionOwned':
      return (state.army.minions[c.id]?.owned ?? 0) >= c.count;
  }
}

export function hasFeat(state: GameState, id: string): boolean {
  return state.feats.includes(id);
}

/** Awards any newly met feats. Returns their ids. */
export function checkFeats(state: GameState): string[] {
  const fresh: string[] = [];
  for (const f of FEATS) {
    if (state.feats.includes(f.id) || !featConditionMet(state, f.condition)) continue;
    state.feats.push(f.id);
    fresh.push(f.id);
    addLog(state, 'event', `Feat earned: ${f.name}. Army damage +${FEAT_DAMAGE_PERCENT}%.`);
  }
  return fresh;
}

/** Army damage multiplier from feats. */
export function featMultiplier(state: GameState): number {
  return 1 + (FEAT_DAMAGE_PERCENT / 100) * state.feats.length;
}
