import type { GameState } from '../engine/state';
import type { Rarity } from '../content/loot';
import { configureAudio, play, type SoundId } from './audio';

/** What the watcher remembers between frames. */
interface Snapshot {
  kills: number;
  bosses: number;
  bossFails: number;
  items: number;
  maxItemId: number;
  souls: number;
  spells: number;
  feats: number;
  rebirths: number;
  ascensions: number;
  schoolLevels: number;
  darkLevel: number;
  rift: boolean;
}

function snapshot(state: GameState): Snapshot {
  const ids = [...state.loot.inventory.map((i) => i.id), ...Object.values(state.loot.equipped).map((i) => i?.id ?? 0)];
  return {
    kills: state.stats.totalKills,
    bosses: state.stats.bossesDefeated,
    bossFails: state.stats.bossesFailed,
    items: state.stats.itemsFound,
    maxItemId: Math.max(0, ...ids),
    souls: state.stats.soulsCaught,
    spells: state.stats.spellsCast,
    feats: state.feats.length,
    rebirths: state.prestige.rebirths,
    ascensions: state.lich.ascensions,
    schoolLevels: Object.values(state.magic.schools).reduce((s, x) => s + x.level, 0),
    darkLevel: state.lich.darkLevel,
    rift: state.rift.active,
  };
}

const LOOT_SOUND: Readonly<Record<Rarity, SoundId>> = {
  common: 'lootCommon',
  magic: 'lootMagic',
  rare: 'lootRare',
  set: 'lootSet',
  legendary: 'lootLegendary',
};

const RANK: Readonly<Record<Rarity, number>> = { common: 0, magic: 1, rare: 2, set: 3, legendary: 4 };

let last: Snapshot | null = null;
let lastState: GameState | null = null;

/** Rarity of the best item found since the last frame (auto-salvaged finds count as common). */
function bestNewRarity(state: GameState, sinceId: number): Rarity {
  let best: Rarity = 'common';
  for (const item of [...state.loot.inventory, ...Object.values(state.loot.equipped)]) {
    if (item && item.id > sinceId && RANK[item.rarity] > RANK[best]) best = item.rarity;
  }
  return best;
}

/**
 * Called every render frame: turns changes in the game state into sounds, so the
 * DOM-free systems never need to know about audio. Returns the rarity of a notable new
 * relic (set or legendary), for the loot flash.
 */
export function watchForSounds(state: GameState): Rarity | null {
  configureAudio(state.settings.sound, state.settings.volume);
  const now = snapshot(state);
  // A new or replaced game (import, reset) only resets the baseline.
  if (!last || lastState !== state || now.items < last.items || now.kills < last.kills) {
    last = now;
    lastState = state;
    return null;
  }
  const prev = last;
  last = now;
  let flash: Rarity | null = null;

  if (now.ascensions > prev.ascensions) play('ascend');
  else if (now.rebirths > prev.rebirths) play('rebirth');
  if (now.rift !== prev.rift) play('rift');
  if (now.bosses > prev.bosses) play('boss');
  else if (now.kills > prev.kills) play('kill');
  if (now.bossFails > prev.bossFails) play('bossFail');
  if (now.items > prev.items) {
    const rarity = bestNewRarity(state, prev.maxItemId);
    play(LOOT_SOUND[rarity]);
    if (rarity === 'legendary' || rarity === 'set') flash = rarity;
  }
  if (now.souls > prev.souls) play('soul');
  if (now.spells > prev.spells) play('spell');
  if (now.feats > prev.feats) play('feat');
  else if (now.schoolLevels > prev.schoolLevels || now.darkLevel > prev.darkLevel) play('levelUp');
  return flash;
}
