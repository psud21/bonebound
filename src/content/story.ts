import type { Condition } from './upgrades';

/** Features that appear as the player progresses. Each one fires a Chronicle entry once. */
export interface UnlockDef {
  id: string;
  /** Short goal name shown in "The Path Ahead". */
  goal: string;
  condition: Condition | { kind: 'start' } | { kind: 'lifetimeBones'; amount: number } | { kind: 'rebirths'; count: number };
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
    id: 'corpses',
    goal: 'Keep the bodies',
    condition: { kind: 'maxFloor', floor: 15 },
    text: 'Some of the fallen are too good to waste. Kills now leave Corpses, and Corpses can raise an Elite: a Grave Champion waits in the Army panel.',
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
    id: 'library',
    goal: 'Find the Forbidden Library',
    condition: { kind: 'maxFloor', floor: 60 },
    text: 'Behind the Weeping Effigy: a library nobody was meant to find. Guardians and tomes yield Lore, and Lore buys research that outlives you. See the Library tab.',
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
    text: 'The seal is broken. Below lies the Drowned Catacombs, where the dead do not stay dead. Enemies here heal over time. The School of Plague answers the damp: see the Grimoire.',
  },
  {
    id: 'bloodSchool',
    goal: 'Learn the price of blood',
    condition: { kind: 'rebirths', count: 1 },
    text: 'Dying taught you something. Blood is only borrowed, and you know how to borrow more. The School of Blood is open.',
  },
  {
    id: 'shadowSchool',
    goal: 'Step into the shadow',
    condition: { kind: 'rebirths', count: 2 },
    text: 'The second death leaves a shadow behind, and the shadow stays with you. The School of Shadow is open.',
  },
  {
    id: 'covens',
    goal: 'Choose a coven',
    condition: { kind: 'rebirths', count: 3 },
    text: 'Four covens have noticed you. Each offers power, and each wants something. Choose one per run in the Phylactery tab.',
  },
  {
    id: 'drownedKing',
    goal: 'Slay the Drowned King',
    condition: { kind: 'maxFloor', floor: 201 },
    text: 'The Drowned King falls, and his bones are still enormous. You could do something with those bones. The Dracolich can now be raised. Ahead: the Ashen Wastes, where the air itself burns.',
  },
  {
    id: 'glacier',
    goal: 'Cross the Ashen Wastes',
    condition: { kind: 'maxFloor', floor: 301 },
    text: 'Past the Furnace Throne, the fire gives way to ice. The Weeping Glacier slows everything that walks, including the dead.',
  },
  {
    id: 'weepingHeart',
    goal: 'Thaw the Weeping Heart',
    condition: { kind: 'maxFloor', floor: 401 },
    text: 'The Weeping Heart stops weeping. Below the glacier the Flesh Gardens bloom, ten foes to every floor. And you are strong enough now to die a second time: Lichdom awaits in its own tab.',
  },
  {
    id: 'gems',
    goal: 'Find a gem',
    condition: { kind: 'maxFloor', floor: 150 },
    text: 'Old Grey Mouth swallowed treasure for centuries. Guardians from here down may leave gems: socket them into rare relics and better, or hand one to an Elite. Three of a kind combine into one finer stone.',
  },
  {
    id: 'rifts',
    goal: 'Tear open a Rift',
    condition: { kind: 'maxFloor', floor: 301 },
    text: 'Past the Furnace Throne the Abyss is thin enough to tear. Deep guardians now leave Rift Keys. A Rift is ten minutes of ever-harder foes; your best depth there makes the whole army stronger.',
  },
  {
    id: 'curses',
    goal: 'Invite a curse',
    condition: { kind: 'rebirths', count: 5 },
    text: 'You have died often enough to bargain with death itself. Curses make a run harder and pay out more Soul Shards. Choose them in the Phylactery before you Rebirth.',
  },
  {
    id: 'cathedral',
    goal: 'Uproot the Great Root',
    condition: { kind: 'maxFloor', floor: 501 },
    text: 'Below the gardens hangs a cathedral, upside down, still holy. Its guardians are consecrated: only Wraiths pass through the wards untouched.',
  },
  {
    id: 'throat',
    goal: 'Unmake the Inverted God',
    condition: { kind: 'maxFloor', floor: 601 },
    text: 'Below everything is the Throat of the Void. It does not end. Neither, now, do you.',
  },
];
