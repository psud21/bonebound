export interface LayerDef {
  id: string;
  name: string;
  /** First floor of this layer (inclusive). */
  fromFloor: number;
  enemies: readonly string[];
  /** Named bosses by floor. Unlisted boss floors use a generic name. */
  bosses: Readonly<Record<number, string>>;
}

export const LAYERS: readonly LayerDef[] = [
  {
    id: 'ossuaryCrypts',
    name: 'The Ossuary Crypts',
    fromFloor: 1,
    enemies: [
      'Crypt Rat',
      'Grave Beetle',
      'Restless Corpse',
      'Cultist Acolyte',
      'Bone Hound',
      'Tomb Spider',
      'Candle Wight',
      'Fallen Templar',
    ],
    bosses: {
      10: 'Gravekeeper Morrow',
      20: 'The Rat Matriarch',
      30: 'Sister Ashgrove',
      40: 'The Hollow Choir',
      50: 'Brother Ossian, the Unburied',
      60: 'The Weeping Effigy',
      70: 'Inquisitor Vale',
      80: 'The Carrion Bishop',
      90: 'Mother of Candles',
      100: 'The Sealed Warden',
    },
  },
  {
    // Placeholder until Layer 2 content arrives in M3.
    id: 'uncharted',
    name: 'Uncharted Depths',
    fromFloor: 101,
    enemies: ['Nameless Thing', 'Drowned Shade', 'Deep Crawler'],
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

/** Deterministic enemy name for a floor and kill index, so it doesn't flicker on reload. */
export function enemyName(floor: number, killIndex: number): string {
  const layer = layerForFloor(floor);
  if (isBossFloor(floor)) return layer.bosses[floor] ?? `Guardian of Floor ${floor}`;
  const i = (floor * 7 + killIndex * 3) % layer.enemies.length;
  return layer.enemies[i]!;
}
