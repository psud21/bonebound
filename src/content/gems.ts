import type { IconName } from '../ui/icons.generated';
import type { Rarity } from './loot';

export type GemType = 'ruby' | 'emerald' | 'amethyst' | 'diamond';

export interface GemDef {
  id: GemType;
  name: string;
  icon: IconName;
  /** Gear stats a gem adds, per point of tier value. */
  stats: Readonly<Record<string, number>>;
  /** Text with {v} for the main value. */
  text: string;
}

export const GEMS: Readonly<Record<GemType, GemDef>> = {
  ruby: { id: 'ruby', name: 'Ruby', icon: 'fire-gem', stats: { minionDamage: 1 }, text: '+{v}% minion damage' },
  emerald: { id: 'emerald', name: 'Emerald', icon: 'emerald', stats: { bones: 1 }, text: '+{v}% Bones' },
  amethyst: { id: 'amethyst', name: 'Amethyst', icon: 'amethyst', stats: { essenceRegen: 0.6 }, text: '+{v}% Essence regeneration' },
  diamond: {
    id: 'diamond',
    name: 'Diamond',
    icon: 'cut-diamond',
    stats: { minionDamage: 0.5, bones: 0.5, essenceRegen: 0.3 },
    text: '+{v}% minion damage and Bones, and more Essence',
  },
};

export const GEM_TYPES: readonly GemType[] = ['ruby', 'emerald', 'amethyst', 'diamond'];

export const GEM_TIERS: readonly string[] = ['Chipped', 'Flawed', 'Plain', 'Flawless', 'Perfect', 'Royal', 'Abyssal'];
export const MAX_GEM_TIER = GEM_TIERS.length;

/** Percent value of a gem's main stat at a tier (1-based): 20, 50, 125, 312… */
export function gemTierValue(tier: number): number {
  return Math.round(20 * 2.5 ** (tier - 1));
}

/** Three gems of one tier combine into one of the next. */
export const GEMS_TO_COMBINE = 3;

/** Sockets an item has, by rarity. */
export const SOCKETS: Readonly<Record<Rarity, number>> = { common: 0, magic: 0, rare: 1, set: 2, legendary: 2 };

/** Gems socketed into an Elite count this many times over. */
export const ELITE_GEM_MULT = 2;

export const GEM_DROPS = {
  /** Deepest floor needed before guardians drop gems. */
  MIN_FLOOR: 150,
  /** Chance a guardian drops a gem. */
  GUARDIAN_CHANCE: 0.5,
};

/** Gem tier that drops at a floor: tier 1 from floor 150, one more every 125 floors. */
export function gemTierForFloor(floor: number): number {
  return Math.max(1, Math.min(MAX_GEM_TIER, 1 + Math.floor((floor - GEM_DROPS.MIN_FLOOR) / 125)));
}

/** A gem is stored as "type:tier", e.g. "ruby:2". */
export function gemKey(type: GemType, tier: number): string {
  return `${type}:${tier}`;
}

export function parseGem(key: string): { type: GemType; tier: number } | null {
  const [type, tierText] = key.split(':');
  const tier = Number(tierText);
  if (!type || !(type in GEMS) || !Number.isInteger(tier) || tier < 1 || tier > MAX_GEM_TIER) return null;
  return { type: type as GemType, tier };
}

export function gemName(key: string): string {
  const g = parseGem(key);
  return g ? `${GEM_TIERS[g.tier - 1]} ${GEMS[g.type].name}` : key;
}
