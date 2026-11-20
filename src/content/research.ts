import type { IconName } from '../ui/icons.generated';
import type { LayerHazard } from './layers';

export type ResearchEffect =
  | { kind: 'minionDamage'; mult: number }
  | { kind: 'minionCost'; mult: number }
  | { kind: 'eliteCost'; mult: number }
  | { kind: 'essence'; maxBonus: number; regenMult: number }
  | { kind: 'schoolXp'; mult: number }
  | { kind: 'cooldown'; mult: number }
  | { kind: 'lootFind'; percent: number }
  | { kind: 'hazard'; hazard: LayerHazard; mult: number }
  | { kind: 'offlineCap'; seconds: number }
  | { kind: 'slots'; extra: number }
  | { kind: 'crypt'; mult: number }
  | { kind: 'shards'; mult: number }
  | { kind: 'lore'; mult: number }
  | { kind: 'corpses'; mult: number };

export type ResearchBranch = 'anatomy' | 'thaumaturgy' | 'cartography' | 'rites';

export const BRANCHES: Readonly<Record<ResearchBranch, { name: string; icon: IconName }>> = {
  anatomy: { name: 'Anatomy', icon: 'ribcage' },
  thaumaturgy: { name: 'Thaumaturgy', icon: 'magic-swirl' },
  cartography: { name: 'Cartography of the Abyss', icon: 'scroll-unfurled' },
  rites: { name: 'Forbidden Rites', icon: 'pentacle' },
};

export interface ResearchDef {
  id: string;
  branch: ResearchBranch;
  name: string;
  description: string;
  /** Lore to begin. */
  cost: number;
  /** Real seconds to finish (online and offline). */
  seconds: number;
  requires: readonly string[];
  effect: ResearchEffect;
}

const min = 60;
const hr = 3600;

export const RESEARCH: readonly ResearchDef[] = [
  // Anatomy
  { id: 'reinforcedMarrow', branch: 'anatomy', name: 'Reinforced Marrow', description: 'Minion damage ×1.25.', cost: 8, seconds: 5 * min, requires: [], effect: { kind: 'minionDamage', mult: 1.25 } },
  { id: 'hollowBones', branch: 'anatomy', name: 'Hollow Bones', description: 'Minions cost 15% less.', cost: 20, seconds: 15 * min, requires: ['reinforcedMarrow'], effect: { kind: 'minionCost', mult: 0.85 } },
  { id: 'championsDrill', branch: 'anatomy', name: 'Champions’ Drill', description: 'Elites cost 25% fewer Corpses.', cost: 30, seconds: 25 * min, requires: ['reinforcedMarrow'], effect: { kind: 'eliteCost', mult: 0.75 } },
  { id: 'necroticSinew', branch: 'anatomy', name: 'Necrotic Sinew', description: 'Minion damage ×1.5.', cost: 60, seconds: 45 * min, requires: ['hollowBones'], effect: { kind: 'minionDamage', mult: 1.5 } },
  { id: 'deathsAnatomy', branch: 'anatomy', name: 'Death’s Anatomy', description: 'Minion damage ×2.', cost: 200, seconds: 2 * hr, requires: ['necroticSinew'], effect: { kind: 'minionDamage', mult: 2 } },
  // Thaumaturgy
  { id: 'essenceChannels', branch: 'thaumaturgy', name: 'Essence Channels', description: 'Essence capacity +50 and regeneration +25%.', cost: 8, seconds: 5 * min, requires: [], effect: { kind: 'essence', maxBonus: 50, regenMult: 1.25 } },
  { id: 'twinGrimoires', branch: 'thaumaturgy', name: 'Twin Grimoires', description: 'Schools gain double experience.', cost: 25, seconds: 20 * min, requires: ['essenceChannels'], effect: { kind: 'schoolXp', mult: 2 } },
  { id: 'spellEcho', branch: 'thaumaturgy', name: 'Spell Echo', description: 'Spell cooldowns −20%.', cost: 70, seconds: 1 * hr, requires: ['twinGrimoires'], effect: { kind: 'cooldown', mult: 0.8 } },
  { id: 'deepWells', branch: 'thaumaturgy', name: 'Deep Wells', description: 'Essence capacity +100 and regeneration ×2.', cost: 150, seconds: 2 * hr, requires: ['spellEcho'], effect: { kind: 'essence', maxBonus: 100, regenMult: 2 } },
  // Cartography
  { id: 'abyssalCharts', branch: 'cartography', name: 'Abyssal Charts', description: 'Item find +50%.', cost: 12, seconds: 10 * min, requires: [], effect: { kind: 'lootFind', percent: 50 } },
  { id: 'tideTables', branch: 'cartography', name: 'Tide Tables', description: 'Drowned Catacombs: enemies heal half as fast.', cost: 35, seconds: 30 * min, requires: ['abyssalCharts'], effect: { kind: 'hazard', hazard: 'regen', mult: 0.5 } },
  { id: 'ashWards', branch: 'cartography', name: 'Ash Wards', description: 'Ashen Wastes: the burn is halved.', cost: 110, seconds: 1 * hr, requires: ['tideTables'], effect: { kind: 'hazard', hazard: 'burn', mult: 0.5 } },
  { id: 'frostLore', branch: 'cartography', name: 'Frost Lore', description: 'Weeping Glacier: the slow is halved.', cost: 250, seconds: 2 * hr, requires: ['ashWards'], effect: { kind: 'hazard', hazard: 'slow', mult: 0.5 } },
  { id: 'carrionMaps', branch: 'cartography', name: 'Carrion Maps', description: 'Corpses ×2.', cost: 45, seconds: 40 * min, requires: ['abyssalCharts'], effect: { kind: 'corpses', mult: 2 } },
  // Forbidden Rites
  { id: 'boneLedgers', branch: 'rites', name: 'Bone Ledgers', description: 'Crypt production ×2.', cost: 15, seconds: 10 * min, requires: [], effect: { kind: 'crypt', mult: 2 } },
  { id: 'patientGraves', branch: 'rites', name: 'Patient Graves', description: 'Offline progress lasts up to 4 hours longer.', cost: 20, seconds: 15 * min, requires: ['boneLedgers'], effect: { kind: 'offlineCap', seconds: 4 * hr } },
  { id: 'secondDesk', branch: 'rites', name: 'A Second Desk', description: 'Research two projects at once.', cost: 50, seconds: 30 * min, requires: ['boneLedgers'], effect: { kind: 'slots', extra: 1 } },
  { id: 'marginalia', branch: 'rites', name: 'Marginalia', description: 'Lore ×1.5.', cost: 60, seconds: 45 * min, requires: ['secondDesk'], effect: { kind: 'lore', mult: 1.5 } },
  { id: 'shardResonance', branch: 'rites', name: 'Shard Resonance', description: 'Rebirth grants 20% more Soul Shards.', cost: 300, seconds: 3 * hr, requires: ['marginalia'], effect: { kind: 'shards', mult: 1.2 } },
];

export const RESEARCH_BY_ID: Readonly<Record<string, ResearchDef>> = Object.fromEntries(RESEARCH.map((r) => [r.id, r]));

export const LIBRARY = {
  /** Deepest floor needed to open the Forbidden Library. */
  UNLOCK_FLOOR: 60,
  /** Lore from a guardian the first time it falls this run: ceil(floor / GUARDIAN_DIVISOR). */
  GUARDIAN_DIVISOR: 20,
  /** Chance per normal kill to find a tome, worth ceil(floor / TOME_DIVISOR) Lore. */
  TOME_CHANCE: 0.002,
  TOME_DIVISOR: 25,
  /** Most tomes one batch of kills can yield. */
  MAX_TOMES_PER_BATCH: 2,
};
