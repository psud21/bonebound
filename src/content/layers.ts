import type { IconName } from '../ui/icons.generated';

export interface Foe {
  name: string;
  icon: IconName;
}

/** Each layer of the Abyss bends the rules in one way. */
export type LayerModifier =
  | { kind: 'none' }
  /** Enemies heal this percent of their max HP per second (guardians heal `guardianPercent`). */
  | { kind: 'regen'; percent: number; guardianPercent: number }
  /** Minions deal this percent less damage (burn-immune minions are spared). */
  | { kind: 'burn'; percent: number }
  /** The army attacks this percent slower. Siphon and spells are unaffected. */
  | { kind: 'slow'; percent: number }
  /** Ordinary floors hold this many foes instead of the usual five. */
  | { kind: 'swarm'; kills: number }
  /** Consecrated guardians take only this fraction of minion damage (Wraiths pierce it). */
  | { kind: 'holy'; guardianDamage: number }
  /** Guardian timers are multiplied by this. */
  | { kind: 'void'; timerMult: number };

export type LayerHazard = Exclude<LayerModifier['kind'], 'none'>;

export interface LayerDef {
  id: string;
  name: string;
  /** First floor of this layer (inclusive). */
  fromFloor: number;
  /** Last floor of this layer (inclusive), or null if endless. */
  toFloor: number | null;
  modifier: LayerModifier;
  /** One line describing the modifier, for the Descent panel. */
  hazard: string;
  enemies: readonly Foe[];
  /** Named bosses by floor. Unlisted boss floors use a generic guardian. */
  bosses: Readonly<Record<number, Foe>>;
}

export const LAYERS: readonly LayerDef[] = [
  {
    id: 'ossuaryCrypts',
    name: 'The Ossuary Crypts',
    fromFloor: 1,
    toFloor: 100,
    modifier: { kind: 'none' },
    hazard: '',
    enemies: [
      { name: 'Crypt Rat', icon: 'rat' },
      { name: 'Grave Beetle', icon: 'beetle-shell' },
      { name: 'Restless Corpse', icon: 'raise-zombie' },
      { name: 'Cultist Acolyte', icon: 'cultist' },
      { name: 'Bone Hound', icon: 'hound' },
      { name: 'Tomb Spider', icon: 'hanging-spider' },
      { name: 'Candle Wight', icon: 'candle-skull' },
      { name: 'Fallen Templar', icon: 'black-knight-helm' },
    ],
    bosses: {
      10: { name: 'Gravekeeper Morrow', icon: 'grim-reaper' },
      20: { name: 'The Rat Matriarch', icon: 'rat' },
      30: { name: 'Sister Ashgrove', icon: 'nun-face' },
      40: { name: 'The Hollow Choir', icon: 'screaming' },
      50: { name: 'Brother Ossian, the Unburied', icon: 'death-skull' },
      60: { name: 'The Weeping Effigy', icon: 'bleeding-eye' },
      70: { name: 'Inquisitor Vale', icon: 'templar-shield' },
      80: { name: 'The Carrion Bishop', icon: 'crow-dive' },
      90: { name: 'Mother of Candles', icon: 'candlebright' },
      100: { name: 'The Sealed Warden', icon: 'dungeon-gate' },
    },
  },
  {
    id: 'drownedCatacombs',
    name: 'The Drowned Catacombs',
    fromFloor: 101,
    toFloor: 200,
    modifier: { kind: 'regen', percent: 4, guardianPercent: 1 },
    hazard: 'The drowned knit themselves back together: enemies heal 4% of their HP each second (guardians 1%).',
    enemies: [
      { name: 'Drowned Thrall', icon: 'drowning' },
      { name: 'Bloated Corpse', icon: 'fish-corpse' },
      { name: 'Grave Eel', icon: 'eel' },
      { name: 'Tide Wraith', icon: 'ghost' },
      { name: 'Barnacle Knight', icon: 'crab' },
      { name: 'Leechling', icon: 'leeching-worm' },
      { name: 'Kraken Spawn', icon: 'kraken-tentacle' },
      { name: 'Angler Horror', icon: 'angler-fish' },
    ],
    bosses: {
      110: { name: 'Abbess Mire', icon: 'hooded-figure' },
      120: { name: 'The Leech Sovereign', icon: 'worm-mouth' },
      130: { name: 'Captain Saltbones', icon: 'pirate-skull' },
      140: { name: 'The Tidebound Choir', icon: 'water-splash' },
      150: { name: 'Old Grey Mouth', icon: 'fish-monster' },
      160: { name: 'The Pale Jelly Saint', icon: 'jellyfish' },
      170: { name: 'The Drowned Cardinal', icon: 'pope-crown' },
      180: { name: 'Kraken of the Ossuary', icon: 'interlaced-tentacles' },
      190: { name: 'The Ferryman’s Echo', icon: 'drakkar-dragon' },
      200: { name: 'The Drowned King', icon: 'sea-dragon' },
    },
  },
  {
    id: 'ashenWastes',
    name: 'The Ashen Wastes',
    fromFloor: 201,
    toFloor: 300,
    modifier: { kind: 'burn', percent: 35 },
    hazard: 'The air burns: minions deal 35% less damage. Bone Golems don’t mind.',
    enemies: [
      { name: 'Cinder Imp', icon: 'imp' },
      { name: 'Ash Wight', icon: 'burning-skull' },
      { name: 'Ember Hound', icon: 'direwolf' },
      { name: 'Pyre Cultist', icon: 'fire-silhouette' },
      { name: 'Slag Golem', icon: 'golem-head' },
      { name: 'Burning Martyr', icon: 'burning-eye' },
      { name: 'Fire Bat', icon: 'evil-bat' },
      { name: 'Flame Templar', icon: 'fire-shield' },
    ],
    bosses: {
      210: { name: 'The Pyre Abbot', icon: 'fire-shrine' },
      220: { name: 'Mother Cinder', icon: 'witch-face' },
      230: { name: 'The Ash Colossus', icon: 'metal-golem-head' },
      240: { name: 'Inquisitor Brand', icon: 'flamethrower-soldier' },
      250: { name: 'The Burning Choir', icon: 'fire-wave' },
      260: { name: 'Saint Ember', icon: 'fire-iris' },
      270: { name: 'The Slag Dragon', icon: 'dragon-breath' },
      280: { name: 'Lord of Cinders', icon: 'burning-meteor' },
      290: { name: 'The Incense Beast', icon: 'fire-breath' },
      300: { name: 'The Furnace Throne', icon: 'fire-bowl' },
    },
  },
  {
    id: 'weepingGlacier',
    name: 'The Weeping Glacier',
    fromFloor: 301,
    toFloor: 400,
    modifier: { kind: 'slow', percent: 30 },
    hazard: 'The cold seeps into old joints: the army attacks 30% slower. Siphon and spells are unaffected.',
    enemies: [
      { name: 'Frost Wight', icon: 'frozen-body' },
      { name: 'Ice Golem', icon: 'ice-golem' },
      { name: 'Rime Wolf', icon: 'wolf-head' },
      { name: 'Glacier Owl', icon: 'barn-owl' },
      { name: 'Pale Bear', icon: 'polar-bear' },
      { name: 'Shard Elemental', icon: 'ice-bolt' },
      { name: 'Entombed Dead', icon: 'frozen-block' },
      { name: 'Snow Wraith', icon: 'snowing' },
    ],
    bosses: {
      310: { name: 'Sister Rime', icon: 'frozen-orb' },
      320: { name: 'The Pale Bear', icon: 'polar-bear' },
      330: { name: 'The Frostfire Seer', icon: 'frostfire' },
      340: { name: 'The Entombed Legion', icon: 'frozen-block' },
      350: { name: 'Saint of Tears', icon: 'tension-snowflake' },
      360: { name: 'The Hollow Mammoth', icon: 'mammoth' },
      370: { name: 'The Ice Iris', icon: 'ice-iris' },
      380: { name: 'Queen of Icicles', icon: 'queen-crown' },
      390: { name: 'Huntmaster Sleet', icon: 'frozen-arrow' },
      400: { name: 'The Weeping Heart', icon: 'cold-heart' },
    },
  },
  {
    id: 'fleshGardens',
    name: 'The Flesh Gardens',
    fromFloor: 401,
    toFloor: 500,
    modifier: { kind: 'swarm', kills: 10 },
    hazard: 'Everything here grows in clusters: ordinary floors hold 10 foes. Bone Mages and Pestilence thrive.',
    enemies: [
      { name: 'Bloom Horror', icon: 'carnivorous-plant' },
      { name: 'Rot Grub', icon: 'maggot' },
      { name: 'Flesh Weaver', icon: 'spider-face' },
      { name: 'Pustule', icon: 'goo-skull' },
      { name: 'Vine Strangler', icon: 'vine-whip' },
      { name: 'Seed Mother', icon: 'plant-seed' },
      { name: 'Thorn Hound', icon: 'thorny-vine' },
      { name: 'Grave Bloom', icon: 'grave-flowers' },
    ],
    bosses: {
      410: { name: 'The Gardener', icon: 'plant-roots' },
      420: { name: 'Mother of Maggots', icon: 'maggot' },
      430: { name: 'The Venus Abbess', icon: 'venus-flytrap' },
      440: { name: 'The Thinking Bloom', icon: 'brain' },
      450: { name: 'Heartwood', icon: 'tentacle-heart' },
      460: { name: 'The Spore Choir', icon: 'spotted-mushroom' },
      470: { name: 'Lady of Lilies', icon: 'lotus-flower' },
      480: { name: 'The Rose Knight', icon: 'rose' },
      490: { name: 'The Sunflower Saint', icon: 'sunflower' },
      500: { name: 'The Great Root', icon: 'holy-oak' },
    },
  },
  {
    id: 'cathedralInverted',
    name: 'The Cathedral Inverted',
    fromFloor: 501,
    toFloor: 600,
    modifier: { kind: 'holy', guardianDamage: 0.34 },
    hazard: 'Consecrated ground: guardians take a third of minion damage. Wraiths pass through the wards.',
    enemies: [
      { name: 'Fallen Seraph', icon: 'angel-wings' },
      { name: 'Hollow Monk', icon: 'monk-face' },
      { name: 'Censer Bearer', icon: 'holy-water' },
      { name: 'Sun Priest', icon: 'sun-priest' },
      { name: 'Grail Knight', icon: 'holy-grail' },
      { name: 'Choir Ghost', icon: 'angel-outfit' },
      { name: 'Relic Golem', icon: 'golem-head' },
      { name: 'Penitent', icon: 'crown-of-thorns' },
    ],
    bosses: {
      510: { name: 'The Upside-Down Bishop', icon: 'pope-crown' },
      520: { name: 'High Priestess Vael', icon: 'tarot-02-the-high-priestess' },
      530: { name: 'The Golden Gate', icon: 'heaven-gate' },
      540: { name: 'Saint Basil Reversed', icon: 'saint-basil-cathedral' },
      550: { name: 'The Holy Symbol', icon: 'holy-symbol' },
      560: { name: 'The Temple Warden', icon: 'temple-gate' },
      570: { name: 'Archon of Altars', icon: 'star-altar' },
      580: { name: 'The Last Inquisitor', icon: 'templar-shield' },
      590: { name: 'The Seraph Without Eyes', icon: 'angel-wings' },
      600: { name: 'The Inverted God', icon: 'all-seeing-eye' },
    },
  },
  {
    id: 'throatOfTheVoid',
    name: 'The Throat of the Void',
    fromFloor: 601,
    toFloor: null,
    modifier: { kind: 'void', timerMult: 0.5 },
    hazard: 'Time thins out at the bottom of everything: guardian timers are halved. It never ends.',
    enemies: [
      { name: 'Nameless Thing', icon: 'tentacles-skull' },
      { name: 'Hungering Dark', icon: 'shadow-grasp' },
      { name: 'Deep Crawler', icon: 'monster-grasp' },
      { name: 'Star Eater', icon: 'death-star' },
      { name: 'Falling Star', icon: 'falling-star' },
      { name: 'The Unshaped', icon: 'brain-tentacle' },
    ],
    bosses: {
      610: { name: 'The First Hunger', icon: 'worm-mouth' },
      620: { name: 'The Star Gate', icon: 'star-gate' },
      650: { name: 'The Unwritten', icon: 'evil-book' },
      660: { name: 'Number of the Beast', icon: 'daemon-skull' },
      700: { name: 'The Throat Itself', icon: 'vortex' },
    },
  },
];

export function layerForFloor(floor: number): LayerDef {
  let current = LAYERS[0]!;
  for (const layer of LAYERS) if (floor >= layer.fromFloor) current = layer;
  return current;
}

/** 1-based layer number for a floor. */
export function layerNumber(floor: number): number {
  return LAYERS.indexOf(layerForFloor(floor)) + 1;
}

export function isBossFloor(floor: number): boolean {
  return floor % 10 === 0;
}

export function bossFor(floor: number): Foe {
  return layerForFloor(floor).bosses[floor] ?? { name: `Guardian of Floor ${floor}`, icon: 'horned-skull' };
}

/** Deterministic enemy for a floor and kill index, so it doesn't flicker on reload. */
export function foeFor(floor: number, killIndex: number): Foe {
  if (isBossFloor(floor)) return bossFor(floor);
  const layer = layerForFloor(floor);
  return layer.enemies[(floor * 7 + killIndex * 3) % layer.enemies.length]!;
}

export function enemyName(floor: number, killIndex: number): string {
  return foeFor(floor, killIndex).name;
}
