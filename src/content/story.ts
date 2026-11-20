import type { Condition } from './upgrades';

/** Features that appear as the player progresses. Each one fires a Chronicle entry once. */
export interface UnlockDef {
  id: string;
  /** Short goal name shown in "The Path Ahead". */
  goal: string;
  condition: Condition | { kind: 'start' } | { kind: 'lifetimeBones'; amount: number };
  text: string;
}

export const UNLOCKS: readonly UnlockDef[] = [
  {
    id: 'start',
    goal: 'Awaken',
    condition: { kind: 'start' },
    text: 'You wake on cold stone. The Church took everything but your hands, and your hands still remember how to raise the dead. Below you, the Abyss breathes.',
  },
  {
    id: 'crypt',
    goal: 'Open the Crypt',
    condition: { kind: 'lifetimeBones', amount: 40 },
    text: 'The ruined crypt above the Abyss is full of graves. Full of bones. The Crypt is yours to work.',
  },
  {
    id: 'bulkBuy',
    goal: 'Raise in batches',
    condition: { kind: 'minionOwned', id: 'skeletonWarrior', count: 10 },
    text: 'Your skeletons have learned to march in ranks. You can now raise them in batches.',
  },
  {
    id: 'firstBoss',
    goal: 'Face the first guardian',
    condition: { kind: 'maxFloor', floor: 10 },
    text: 'Something large waits on floor 10. Guardians must be defeated before the timer runs out, or they will throw your army back.',
  },
  {
    id: 'souls',
    goal: 'Draw out lost souls',
    condition: { kind: 'maxFloor', floor: 11 },
    text: 'With Morrow fallen, lost souls begin to drift up from below. Catch one before it fades.',
  },
  {
    id: 'loot',
    goal: 'Claim a relic',
    condition: { kind: 'maxFloor', floor: 11 },
    text: 'Morrow left something behind: a relic, still warm. Guardians always drop one, and lesser foes sometimes do. Check the Relics tab.',
  },
  {
    id: 'wardens',
    goal: 'Bargain with the liches',
    condition: { kind: 'lifetimeBones', amount: 800 },
    text: 'Old liches haunt the crypt, bored and underemployed. For a price, they’ll run your graveworks for you.',
  },
  {
    id: 'floor25',
    goal: 'Hear the whisper',
    condition: { kind: 'maxFloor', floor: 25 },
    text: 'The whisper from below is clearer now. It knows your name. It seems pleased.',
  },
  {
    id: 'essence',
    goal: 'Taste the Essence',
    condition: { kind: 'maxFloor', floor: 30 },
    text: 'The air below floor 30 is thick with Essence. Your old spellbook stirs. The School of Bone is open to you: see the Grimoire.',
  },
  {
    id: 'floor50',
    goal: 'The carved names',
    condition: { kind: 'maxFloor', floor: 50 },
    text: 'Halfway through the Ossuary Crypts. The walls here are carved with the names of necromancers who came before you. Many names. No exits.',
  },
  {
    id: 'floor75',
    goal: 'A place to keep your soul',
    condition: { kind: 'maxFloor', floor: 75 },
    text: 'Your body aches in ways bones should not. The voice offers a phylactery: a place to keep your soul. Die, and you will rise again, stronger. The Phylactery tab is open.',
  },
  {
    id: 'floor100',
    goal: 'The Sealed Warden',
    condition: { kind: 'maxFloor', floor: 100 },
    text: 'The Sealed Warden bars the way to the true depths. Beyond it, the darkness is a different kind of dark.',
  },
  {
    id: 'layerOneCleared',
    goal: 'Break the seal',
    condition: { kind: 'maxFloor', floor: 101 },
    text: 'The seal is broken. You stand at the edge of something uncharted. (Layer 2 arrives in a future update.)',
  },
];
