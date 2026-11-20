import type { SpellBuff } from './spells';

export type BuffId = 'soulFrenzy' | 'bloodMoon' | SpellBuff;

export interface BuffDef {
  id: BuffId;
  name: string;
  description: string;
  seconds: number;
}

export const BUFFS: Readonly<Record<BuffId, BuffDef>> = {
  soulFrenzy: { id: 'soulFrenzy', name: 'Soul Frenzy', description: 'All Bones gained ×7.', seconds: 30 },
  bloodMoon: { id: 'bloodMoon', name: 'Blood Moon', description: 'Army damage ×3.', seconds: 20 },
  raiseLegion: { id: 'raiseLegion', name: 'Raise Legion', description: 'Army damage ×1.5 or more, growing with School of Bone levels.', seconds: 20 },
  ossuaryRite: { id: 'ossuaryRite', name: 'Ossuary Rite', description: 'Graveworks cycle ×3 faster.', seconds: 30 },
  bloodRite: { id: 'bloodRite', name: 'Blood Rite', description: 'Army damage ×4 or more, growing with School of Blood levels.', seconds: 15 },
  plagueWind: { id: 'plagueWind', name: 'Plague Wind', description: 'Army damage +50% or more; enemies can’t heal.', seconds: 20 },
  rot: { id: 'rot', name: 'Rot', description: 'Enemies take 40% more damage, or more with School of Plague levels.', seconds: 30 },
  pestilence: { id: 'pestilence', name: 'Pestilence', description: 'Double damage or more to non-guardian enemies.', seconds: 20 },
  curseOfFrailty: { id: 'curseOfFrailty', name: 'Curse of Frailty', description: 'Guardians take double damage or more.', seconds: 25 },
  eclipse: { id: 'eclipse', name: 'Eclipse', description: 'Siphon ×10 and army damage ×1.5, or more with School of Shadow levels.', seconds: 15 },
};
export const BUFF_MULTIPLIERS = { soulFrenzy: 7, bloodMoon: 3, raiseLegion: 2, ossuaryRite: 3 } as const;

/** Buffs that come from Wandering Souls (the Ring of the Restless doubles these). */
export const SOUL_BUFFS: readonly BuffId[] = ['soulFrenzy', 'bloodMoon'];

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
