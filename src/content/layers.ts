import type { IconName } from '../ui/icons.generated';

export interface Foe {
  name: string;
  icon: IconName;
}

export interface LayerDef {
  id: string;
  name: string;
  /** First floor of this layer (inclusive). */
  fromFloor: number;
  /** Last floor of this layer (inclusive), or null if endless. */
  toFloor: number | null;
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
    // Placeholder until Layer 2 content arrives in M3.
    id: 'uncharted',
    name: 'Uncharted Depths',
    fromFloor: 101,
    toFloor: null,
    enemies: [
      { name: 'Nameless Thing', icon: 'tentacles-skull' },
      { name: 'Drowned Shade', icon: 'ghost' },
      { name: 'Deep Crawler', icon: 'monster-grasp' },
    ],
    bosses: {},
  },
];

export function layerForFloor(floor: number): LayerDef {
  let current = LAYERS[0]!;
  for (const layer of LAYERS) if (floor >= layer.fromFloor) current = layer;
  return current;
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
