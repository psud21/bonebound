export type BuffId = 'soulFrenzy' | 'bloodMoon';

export interface BuffDef {
  id: BuffId;
  name: string;
  description: string;
  seconds: number;
}

export const BUFFS: Readonly<Record<BuffId, BuffDef>> = {
  soulFrenzy: { id: 'soulFrenzy', name: 'Soul Frenzy', description: 'All Bones gained ×7.', seconds: 30 },
  bloodMoon: { id: 'bloodMoon', name: 'Blood Moon', description: 'Army damage ×3.', seconds: 20 },
};

export const BUFF_MULTIPLIERS = { soulFrenzy: 7, bloodMoon: 3 } as const;

export type SoulReward = 'soulFrenzy' | 'bloodMoon' | 'graveRush' | 'boneShower';

/** What clicking a Wandering Soul can give, by weight. */
export const SOUL_REWARDS: readonly { value: SoulReward; weight: number }[] = [
  { value: 'soulFrenzy', weight: 40 },
  { value: 'boneShower', weight: 30 },
  { value: 'bloodMoon', weight: 20 },
  { value: 'graveRush', weight: 10 },
];

/** Floors skipped by Grave Rush (stops before an unbeaten boss). */
export const GRAVE_RUSH_FLOORS = 5;
/** Bone Shower gives this many seconds of current income (with a small minimum). */
export const BONE_SHOWER_SECONDS = 600;
export const BONE_SHOWER_MINIMUM = 25;
