import type { IconName } from '../ui/icons.generated';
import { MINIONS } from './minions';
import type { LayerHazard } from './layers';
import type { SchoolId } from './spells';

export type ItemKind = 'staff' | 'offhand' | 'helm' | 'chest' | 'gloves' | 'boots' | 'amulet' | 'ring';
export type EquipSlot = 'staff' | 'offhand' | 'helm' | 'chest' | 'gloves' | 'boots' | 'amulet' | 'ring1' | 'ring2';
export type Rarity = 'common' | 'magic' | 'rare' | 'set' | 'legendary';

export const EQUIP_SLOTS: readonly EquipSlot[] = ['staff', 'offhand', 'helm', 'chest', 'gloves', 'boots', 'amulet', 'ring1', 'ring2'];
export const ITEM_KINDS: readonly ItemKind[] = ['staff', 'offhand', 'helm', 'chest', 'gloves', 'boots', 'amulet', 'ring'];
export const RARITIES: readonly Rarity[] = ['common', 'magic', 'rare', 'set', 'legendary'];

export function kindForSlot(slot: EquipSlot): ItemKind {
  return slot === 'ring1' || slot === 'ring2' ? 'ring' : slot;
}

export const KIND_INFO: Readonly<Record<ItemKind, { label: string; icon: IconName; bases: readonly string[]; implicit: string }>> = {
  staff: { label: 'Staff', icon: 'wizard-staff', bases: ['Bone Staff', 'Grave Rod', 'Marrow Wand', 'Ossified Scepter'], implicit: 'minionDamage' },
  offhand: { label: 'Off-hand', icon: 'skull-shield', bases: ['Skull Totem', 'Grim Tome', 'Ribcage Ward'], implicit: 'clickDamage' },
  helm: { label: 'Helm', icon: 'visored-helm', bases: ['Gravecap', 'Bone Crown', 'Mourning Hood'], implicit: 'bones' },
  chest: { label: 'Chest', icon: 'breastplate', bases: ['Burial Shroud', 'Ribbed Cuirass', 'Embalmer’s Robe'], implicit: 'crypt' },
  gloves: { label: 'Gloves', icon: 'gauntlet', bases: ['Gravedigger Gloves', 'Knucklebone Grips', 'Clawed Gauntlets'], implicit: 'bossDamage' },
  boots: { label: 'Boots', icon: 'leather-boot', bases: ['Tomb Treads', 'Ashen Boots', 'Crypt Striders'], implicit: 'lootFind' },
  amulet: { label: 'Amulet', icon: 'gem-pendant', bases: ['Vertebra Charm', 'Soulglass Pendant', 'Teeth Necklace'], implicit: 'essenceRegen' },
  ring: { label: 'Ring', icon: 'skull-ring', bases: ['Knuckle Ring', 'Signet of Bone', 'Grave Band'], implicit: 'random' },
};

export interface StatDef {
  id: string;
  /** Text with {v} for the value, e.g. "+{v}% minion damage". */
  text: string;
  base: number;
  perLevel: number;
  /** Used to compare items ("is this an upgrade?"). */
  weight: number;
  /** Suffix used in item names when this is the top stat. */
  suffix: string;
  /** Whole numbers (percent) or one decimal (seconds). */
  decimals: number;
}

const coreStats: StatDef[] = [
  { id: 'minionDamage', text: '+{v}% minion damage', base: 2, perLevel: 0.25, weight: 1, suffix: 'of the Legion', decimals: 0 },
  { id: 'bossDamage', text: '+{v}% damage to guardians', base: 4, perLevel: 0.3, weight: 0.5, suffix: 'of Slaying', decimals: 0 },
  { id: 'clickDamage', text: '+{v}% Siphon damage', base: 5, perLevel: 0.5, weight: 0.3, suffix: 'of the Grasp', decimals: 0 },
  { id: 'bones', text: '+{v}% Bones', base: 2, perLevel: 0.15, weight: 1, suffix: 'of Plenty', decimals: 0 },
  { id: 'crypt', text: '+{v}% Crypt production', base: 3, perLevel: 0.3, weight: 0.6, suffix: 'of the Gravekeeper', decimals: 0 },
  { id: 'essenceRegen', text: '+{v}% Essence regeneration', base: 5, perLevel: 0.3, weight: 0.3, suffix: 'of Whispers', decimals: 0 },
  { id: 'lootFind', text: '+{v}% item find', base: 5, perLevel: 0.3, weight: 0.3, suffix: 'of Hoarding', decimals: 0 },
  { id: 'bossTimer', text: '+{v}s guardian timer', base: 1, perLevel: 0.05, weight: 3, suffix: 'of Patience', decimals: 1 },
  { id: 'soulFrequency', text: '+{v}% Wandering Soul frequency', base: 3, perLevel: 0.2, weight: 0.4, suffix: 'of Lost Souls', decimals: 0 },
];

const minionStats: StatDef[] = MINIONS.map((m) => ({
  id: `minion:${m.id}`,
  text: `+{v}% ${m.name} damage`,
  base: 6,
  perLevel: 0.4,
  weight: 0.35,
  suffix: `of the ${m.name}`,
  decimals: 0,
}));

export const STATS: readonly StatDef[] = [...coreStats, ...minionStats];
export const STATS_BY_ID: Readonly<Record<string, StatDef>> = Object.fromEntries(STATS.map((s) => [s.id, s]));

export const RARITY_INFO: Readonly<Record<Rarity, { label: string; affixes: [number, number]; mult: number; dust: number }>> = {
  common: { label: 'Common', affixes: [0, 0], mult: 1, dust: 1 },
  magic: { label: 'Magic', affixes: [1, 2], mult: 1.15, dust: 3 },
  rare: { label: 'Rare', affixes: [3, 4], mult: 1.3, dust: 10 },
  set: { label: 'Set', affixes: [3, 3], mult: 1.4, dust: 25 },
  legendary: { label: 'Legendary', affixes: [3, 3], mult: 1.5, dust: 40 },
};

export const NORMAL_RARITY_WEIGHTS: Readonly<Record<Rarity, number>> = { common: 62, magic: 28, rare: 9, set: 1.5, legendary: 1 };
export const BOSS_RARITY_WEIGHTS: Readonly<Record<Rarity, number>> = { common: 0, magic: 40, rare: 40, set: 10, legendary: 10 };
/** Set relics only drop at or below this floor. */
export const SET_MIN_FLOOR = 101;

/** Chance per normal kill to drop an item, before item find. */
export const DROP_CHANCE = 0.004;
/** Most items one batch of kills can drop (keeps offline floods sane). */
export const MAX_DROPS_PER_BATCH = 3;
export const INVENTORY_SIZE = 30;

export type LegendaryEffect =
  | { kind: 'minionMult'; id: string; mult: number }
  | { kind: 'clickCrit'; chance: number; mult: number }
  | { kind: 'soulBoost' }
  | { kind: 'wardenMult'; mult: number }
  | { kind: 'bossTimer'; seconds: number }
  | { kind: 'floorSkip'; chance: number }
  | { kind: 'allDamage'; mult: number }
  | { kind: 'guardianDamage'; mult: number }
  | { kind: 'clickMult'; mult: number }
  | { kind: 'ignoreHazard'; hazard: LayerHazard }
  | { kind: 'corpseMult'; mult: number }
  | { kind: 'schoolPower'; school: SchoolId; mult: number }
  | { kind: 'schoolCooldown'; school: SchoolId; mult: number }
  | { kind: 'noSacrifice' };

export interface LegendaryDef {
  id: string;
  name: string;
  kind: ItemKind;
  power: string;
  effect: LegendaryEffect;
  /** Only drops at or below this floor. */
  minFloor?: number;
}

export const LEGENDARIES: readonly LegendaryDef[] = [
  {
    id: 'gravecallersStaff',
    name: "Gravecaller's Staff",
    kind: 'staff',
    power: 'Skeleton Warriors deal ×5 damage.',
    effect: { kind: 'minionMult', id: 'skeletonWarrior', mult: 5 },
  },
  {
    id: 'quiverSkull',
    name: 'The Quiver Skull',
    kind: 'offhand',
    power: 'Skeletal Archers deal ×4 damage.',
    effect: { kind: 'minionMult', id: 'skeletalArcher', mult: 4 },
  },
  {
    id: 'hourglassHelm',
    name: 'Hourglass Helm',
    kind: 'helm',
    power: 'Guardian timer +15 seconds.',
    effect: { kind: 'bossTimer', seconds: 15 },
  },
  {
    id: 'shroudOfWails',
    name: 'Shroud of Wails',
    kind: 'chest',
    power: 'Wraiths deal ×4 damage.',
    effect: { kind: 'minionMult', id: 'wraith', mult: 4 },
  },
  {
    id: 'bloodlettersGrip',
    name: "Bloodletter's Grip",
    kind: 'gloves',
    power: 'Siphon has a 15% chance to strike for ×20 damage.',
    effect: { kind: 'clickCrit', chance: 0.15, mult: 20 },
  },
  {
    id: 'stridersOfTheDeep',
    name: 'Striders of the Deep',
    kind: 'boots',
    power: 'Clearing a floor has a 10% chance to clear the next one too.',
    effect: { kind: 'floorSkip', chance: 0.1 },
  },
  {
    id: 'wardensbane',
    name: 'Wardensbane',
    kind: 'amulet',
    power: 'Graveworks run by a Warden produce ×3 Bones.',
    effect: { kind: 'wardenMult', mult: 3 },
  },
  {
    id: 'ringOfTheRestless',
    name: 'Ring of the Restless',
    kind: 'ring',
    power: 'Wandering Souls appear twice as often, and their buffs last twice as long.',
    effect: { kind: 'soulBoost' },
  },
  // Deeper legendaries (Layer 2 and below)
  {
    id: 'tidecallersCenser',
    name: "Tidecaller's Censer",
    kind: 'offhand',
    power: 'Enemies never heal in the Drowned Catacombs.',
    effect: { kind: 'ignoreHazard', hazard: 'regen' },
    minFloor: 101,
  },
  {
    id: 'emberCrown',
    name: 'The Ember Crown',
    kind: 'helm',
    power: 'Your minions ignore the Ashen Wastes burn.',
    effect: { kind: 'ignoreHazard', hazard: 'burn' },
    minFloor: 101,
  },
  {
    id: 'heartOfTheGlacier',
    name: 'Heart of the Glacier',
    kind: 'amulet',
    power: 'The Weeping Glacier no longer slows your army.',
    effect: { kind: 'ignoreHazard', hazard: 'slow' },
    minFloor: 101,
  },
  {
    id: 'golemheartPlate',
    name: 'Golemheart Plate',
    kind: 'chest',
    power: 'Bone Golems deal ×4 damage.',
    effect: { kind: 'minionMult', id: 'boneGolem', mult: 4 },
    minFloor: 101,
  },
  {
    id: 'commandersGauntlets',
    name: "Knight-Commander's Gauntlets",
    kind: 'gloves',
    power: 'Death Knights deal ×4 damage.',
    effect: { kind: 'minionMult', id: 'deathKnight', mult: 4 },
    minFloor: 101,
  },
  {
    id: 'wailingBand',
    name: 'The Wailing Band',
    kind: 'ring',
    power: 'Banshees deal ×4 damage.',
    effect: { kind: 'minionMult', id: 'banshee', mult: 4 },
    minFloor: 101,
  },
  {
    id: 'sanguineScepter',
    name: 'Sanguine Scepter',
    kind: 'staff',
    power: 'Blood Rite no longer sacrifices minions.',
    effect: { kind: 'noSacrifice' },
    minFloor: 101,
  },
  {
    id: 'corpsewalkers',
    name: 'Corpsewalkers',
    kind: 'boots',
    power: 'Corpses ×3.',
    effect: { kind: 'corpseMult', mult: 3 },
    minFloor: 101,
  },
];

export interface SetDef {
  id: string;
  name: string;
  /** Item names by kind; the set has one piece per listed kind. */
  pieces: Partial<Record<ItemKind, string>>;
  /** Bonuses by pieces worn. */
  bonuses: readonly { pieces: number; text: string; effects: readonly LegendaryEffect[] }[];
}

export const SETS: readonly SetDef[] = [
  {
    id: 'graveLord',
    name: "Grave Lord's Regalia",
    pieces: {
      staff: "Grave Lord's Scepter",
      helm: "Grave Lord's Crown",
      chest: "Grave Lord's Mantle",
      gloves: "Grave Lord's Grasp",
      boots: "Grave Lord's Procession",
      amulet: "Grave Lord's Seal",
    },
    bonuses: [
      {
        pieces: 2,
        text: 'Skeleton Warriors and Skeletal Archers deal ×4 damage.',
        effects: [
          { kind: 'minionMult', id: 'skeletonWarrior', mult: 4 },
          { kind: 'minionMult', id: 'skeletalArcher', mult: 4 },
        ],
      },
      { pieces: 4, text: 'Army damage ×2.', effects: [{ kind: 'allDamage', mult: 2 }] },
      { pieces: 6, text: 'Army damage ×3.', effects: [{ kind: 'allDamage', mult: 3 }] },
    ],
  },
  {
    id: 'plaguebringer',
    name: "Plaguebringer's Vestments",
    pieces: {
      offhand: "Plaguebringer's Censer",
      helm: "Plaguebringer's Beak",
      chest: "Plaguebringer's Coat",
      gloves: "Plaguebringer's Gloves",
      boots: "Plaguebringer's Galoshes",
      ring: "Plaguebringer's Signet",
    },
    bonuses: [
      { pieces: 2, text: 'Plague spells ×1.5 power.', effects: [{ kind: 'schoolPower', school: 'plague', mult: 1.5 }] },
      { pieces: 4, text: 'Enemies never heal.', effects: [{ kind: 'ignoreHazard', hazard: 'regen' }] },
      { pieces: 6, text: 'Guardians take ×3 damage.', effects: [{ kind: 'guardianDamage', mult: 3 }] },
    ],
  },
  {
    id: 'bloodsworn',
    name: 'Bloodsworn Raiment',
    pieces: {
      staff: 'Bloodsworn Athame',
      offhand: 'Bloodsworn Chalice',
      chest: 'Bloodsworn Vestment',
      gloves: 'Bloodsworn Wraps',
      amulet: 'Bloodsworn Locket',
      ring: 'Bloodsworn Band',
    },
    bonuses: [
      { pieces: 2, text: 'Blood spell cooldowns −30%.', effects: [{ kind: 'schoolCooldown', school: 'blood', mult: 0.7 }] },
      { pieces: 4, text: 'Siphon ×5.', effects: [{ kind: 'clickMult', mult: 5 }] },
      { pieces: 6, text: 'Army damage ×2.5.', effects: [{ kind: 'allDamage', mult: 2.5 }] },
    ],
  },
];

export const SETS_BY_ID: Readonly<Record<string, SetDef>> = Object.fromEntries(SETS.map((s) => [s.id, s]));

export const LEGENDARIES_BY_ID: Readonly<Record<string, LegendaryDef>> = Object.fromEntries(
  LEGENDARIES.map((l) => [l.id, l]),
);
