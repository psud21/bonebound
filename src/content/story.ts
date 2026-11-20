import type { Condition } from './upgrades';

/** Features that appear as the player progresses. Each one fires a Chronicle entry once. */
export interface UnlockDef {
  id: string;
  condition: Condition | { kind: 'start' } | { kind: 'lifetimeBones'; amount: number };
  text: string;
}

export const UNLOCKS: readonly UnlockDef[] = [
  {
    id: 'start',
    condition: { kind: 'start' },
    text: 'You wake on cold stone. The Church took everything but your hands, and your hands still remember how to raise the dead. Below you, the Abyss breathes.',
  },
  {
    id: 'crypt',
    condition: { kind: 'lifetimeBones', amount: 40 },
    text: 'The ruined crypt above the Abyss is full of graves. Full of bones. The Crypt is yours to work.',
  },
  {
    id: 'bulkBuy',
    condition: { kind: 'minionOwned', id: 'skeletonWarrior', count: 10 },
    text: 'Your skeletons have learned to march in ranks. You can now raise them in batches.',
  },
  {
    id: 'firstBoss',
    condition: { kind: 'maxFloor', floor: 10 },
    text: 'Something large waits on floor 10. Guardians must be defeated before the timer runs out, or they will throw your army back.',
  },
  {
    id: 'souls',
    condition: { kind: 'maxFloor', floor: 11 },
    text: 'With Morrow fallen, lost souls begin to drift up from below. Catch one before it fades.',
  },
  {
    id: 'wardens',
    condition: { kind: 'lifetimeBones', amount: 800 },
    text: 'Old liches haunt the crypt, bored and underemployed. For a price, they’ll run your graveworks for you.',
  },
  {
    id: 'floor25',
    condition: { kind: 'maxFloor', floor: 25 },
    text: 'The whisper from below is clearer now. It knows your name. It seems pleased.',
  },
  {
    id: 'floor50',
    condition: { kind: 'maxFloor', floor: 50 },
    text: 'Halfway through the Ossuary Crypts. The walls here are carved with the names of necromancers who came before you. Many names. No exits.',
  },
  {
    id: 'floor75',
    condition: { kind: 'maxFloor', floor: 75 },
    text: 'Your body aches in ways bones should not. The voice promises that death would only be a doorway, if you had somewhere to keep your soul.',
  },
  {
    id: 'floor100',
    condition: { kind: 'maxFloor', floor: 100 },
    text: 'The Sealed Warden bars the way to the true depths. Beyond it, the darkness is a different kind of dark.',
  },
  {
    id: 'layerOneCleared',
    condition: { kind: 'maxFloor', floor: 101 },
    text: 'The seal is broken. You stand at the edge of something uncharted. (Layer 2 arrives in a future update.)',
  },
];
