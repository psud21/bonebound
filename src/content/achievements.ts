import type { IconName } from '../ui/icons.generated';
import type { SchoolId } from './spells';

export type FeatCondition =
  | { kind: 'bestFloor'; floor: number }
  | { kind: 'stat'; stat:
        | 'totalKills'
        | 'totalClicks'
        | 'soulsCaught'
        | 'itemsFound'
        | 'legendariesFound'
        | 'bossesDefeated'
        | 'spellsCast'
        | 'corpsesEarned'
        | 'gemsFound'; count: number }
  | { kind: 'lifetimeBones'; amount: number }
  | { kind: 'rebirths'; count: number }
  | { kind: 'schoolLevel'; school: SchoolId | 'any'; level: number }
  | { kind: 'eliteLevels'; count: number }
  | { kind: 'research'; count: number }
  | { kind: 'coven' }
  | { kind: 'setPieces'; count: number }
  | { kind: 'minionOwned'; id: string; count: number }
  | { kind: 'riftBest'; depth: number }
  | { kind: 'ascensions'; count: number }
  | { kind: 'darkLevel'; level: number }
  | { kind: 'curses'; count: number };

export interface FeatDef {
  id: string;
  name: string;
  description: string;
  icon: IconName;
  condition: FeatCondition;
}

/** Each feat earned adds this percent to army damage, forever. */
export const FEAT_DAMAGE_PERCENT = 1;

export const FEATS: readonly FeatDef[] = [
  // Depth
  { id: 'floor10', name: 'First Steps Down', description: 'Reach floor 10.', icon: 'stairs', condition: { kind: 'bestFloor', floor: 10 } },
  { id: 'floor50', name: 'Halfway to Nowhere', description: 'Reach floor 50.', icon: 'stairs', condition: { kind: 'bestFloor', floor: 50 } },
  { id: 'floor100', name: 'The Seal', description: 'Reach floor 100.', icon: 'dungeon-gate', condition: { kind: 'bestFloor', floor: 100 } },
  { id: 'floor150', name: 'Holding Your Breath', description: 'Reach floor 150.', icon: 'drowning', condition: { kind: 'bestFloor', floor: 150 } },
  { id: 'floor201', name: 'Kingslayer', description: 'Defeat the Drowned King.', icon: 'sea-dragon', condition: { kind: 'bestFloor', floor: 201 } },
  { id: 'floor250', name: 'Ash in Your Teeth', description: 'Reach floor 250.', icon: 'burning-skull', condition: { kind: 'bestFloor', floor: 250 } },
  { id: 'floor301', name: 'Through the Furnace', description: 'Defeat the Furnace Throne.', icon: 'fire-bowl', condition: { kind: 'bestFloor', floor: 301 } },
  { id: 'floor350', name: 'Cold Comfort', description: 'Reach floor 350.', icon: 'frozen-body', condition: { kind: 'bestFloor', floor: 350 } },
  { id: 'floor401', name: 'Heart of Ice', description: 'Defeat the Weeping Heart.', icon: 'cold-heart', condition: { kind: 'bestFloor', floor: 401 } },
  // Slaughter
  { id: 'kills1k', name: 'A Thousand Graves', description: 'Defeat 1,000 enemies.', icon: 'crossed-bones', condition: { kind: 'stat', stat: 'totalKills', count: 1_000 } },
  { id: 'kills100k', name: 'Necropolis', description: 'Defeat 100,000 enemies.', icon: 'graveyard', condition: { kind: 'stat', stat: 'totalKills', count: 100_000 } },
  { id: 'bosses50', name: 'Guardian’s Bane', description: 'Defeat 50 guardians.', icon: 'horned-skull', condition: { kind: 'stat', stat: 'bossesDefeated', count: 50 } },
  { id: 'bosses250', name: 'No Gate Holds', description: 'Defeat 250 guardians.', icon: 'horned-skull', condition: { kind: 'stat', stat: 'bossesDefeated', count: 250 } },
  { id: 'clicks1k', name: 'Restless Hands', description: 'Siphon 1,000 times.', icon: 'skeletal-hand', condition: { kind: 'stat', stat: 'totalClicks', count: 1_000 } },
  { id: 'clicks10k', name: 'Carpal Tunnel of the Damned', description: 'Siphon 10,000 times.', icon: 'skeletal-hand', condition: { kind: 'stat', stat: 'totalClicks', count: 10_000 } },
  // Riches
  { id: 'bones1b', name: 'Ossuary Magnate', description: 'Earn 1 billion Bones in all.', icon: 'two-coins', condition: { kind: 'lifetimeBones', amount: 1e9 } },
  { id: 'bones1t', name: 'Bone Baron', description: 'Earn 1 trillion Bones in all.', icon: 'two-coins', condition: { kind: 'lifetimeBones', amount: 1e12 } },
  { id: 'bones1qa', name: 'The Calcified Crown', description: 'Earn 1 quadrillion Bones in all.', icon: 'two-coins', condition: { kind: 'lifetimeBones', amount: 1e15 } },
  { id: 'corpses1k', name: 'Body Count', description: 'Gather 1,000 Corpses in all.', icon: 'raise-zombie', condition: { kind: 'stat', stat: 'corpsesEarned', count: 1_000 } },
  { id: 'warriors200', name: 'Skeleton Crew', description: 'Command 200 Skeleton Warriors at once.', icon: 'skeleton', condition: { kind: 'minionOwned', id: 'skeletonWarrior', count: 200 } },
  { id: 'dracolich', name: 'Wings of the Drowned', description: 'Raise a Dracolich.', icon: 'spiked-dragon-head', condition: { kind: 'minionOwned', id: 'dracolich', count: 1 } },
  // Souls and loot
  { id: 'souls25', name: 'Soul Collector', description: 'Catch 25 Wandering Souls.', icon: 'soul', condition: { kind: 'stat', stat: 'soulsCaught', count: 25 } },
  { id: 'souls200', name: 'Lantern Bearer', description: 'Catch 200 Wandering Souls.', icon: 'lantern-flame', condition: { kind: 'stat', stat: 'soulsCaught', count: 200 } },
  { id: 'items100', name: 'Grave Robber', description: 'Find 100 relics.', icon: 'knapsack', condition: { kind: 'stat', stat: 'itemsFound', count: 100 } },
  { id: 'legendary1', name: 'Something Legendary', description: 'Find a legendary relic.', icon: 'sparkles', condition: { kind: 'stat', stat: 'legendariesFound', count: 1 } },
  { id: 'legendary10', name: 'Hoard of Legends', description: 'Find 10 legendary relics.', icon: 'sparkles', condition: { kind: 'stat', stat: 'legendariesFound', count: 10 } },
  { id: 'set2', name: 'Matching Set', description: 'Wear 2 pieces of one set.', icon: 'breastplate', condition: { kind: 'setPieces', count: 2 } },
  { id: 'set6', name: 'Fully Regaled', description: 'Wear all 6 pieces of one set.', icon: 'breastplate', condition: { kind: 'setPieces', count: 6 } },
  // Magic
  { id: 'spells100', name: 'Murmurer', description: 'Cast 100 spells.', icon: 'spell-book', condition: { kind: 'stat', stat: 'spellsCast', count: 100 } },
  { id: 'spells2k', name: 'Archmage of the Grave', description: 'Cast 2,000 spells.', icon: 'spell-book', condition: { kind: 'stat', stat: 'spellsCast', count: 2_000 } },
  { id: 'school10', name: 'Adept', description: 'Raise any school to level 10.', icon: 'magic-swirl', condition: { kind: 'schoolLevel', school: 'any', level: 10 } },
  { id: 'blood5', name: 'Bloodied', description: 'Raise the School of Blood to level 5.', icon: 'bleeding-heart', condition: { kind: 'schoolLevel', school: 'blood', level: 5 } },
  { id: 'plague5', name: 'Contagious', description: 'Raise the School of Plague to level 5.', icon: 'poison-cloud', condition: { kind: 'schoolLevel', school: 'plague', level: 5 } },
  { id: 'shadow5', name: 'Unseen', description: 'Raise the School of Shadow to level 5.', icon: 'cursed-star', condition: { kind: 'schoolLevel', school: 'shadow', level: 5 } },
  // Death and rebirth
  { id: 'rebirth1', name: 'Not Quite Dead', description: 'Perform a Rebirth.', icon: 'soul-vessel', condition: { kind: 'rebirths', count: 1 } },
  { id: 'rebirth5', name: 'Habitual Resurrection', description: 'Perform 5 Rebirths.', icon: 'soul-vessel', condition: { kind: 'rebirths', count: 5 } },
  { id: 'rebirth15', name: 'Death Is a Formality', description: 'Perform 15 Rebirths.', icon: 'soul-vessel', condition: { kind: 'rebirths', count: 15 } },
  { id: 'coven', name: 'Sworn', description: 'Join a coven.', icon: 'pentagram-rose', condition: { kind: 'coven' } },
  { id: 'elites25', name: 'Officer Corps', description: 'Reach 25 Elite levels in one run.', icon: 'knight-banner', condition: { kind: 'eliteLevels', count: 25 } },
  { id: 'elites75', name: 'The Honour Guard', description: 'Reach 75 Elite levels in one run.', icon: 'knight-banner', condition: { kind: 'eliteLevels', count: 75 } },
  { id: 'research5', name: 'Bookish', description: 'Complete 5 research projects.', icon: 'evil-book', condition: { kind: 'research', count: 5 } },
  { id: 'research15', name: 'Forbidden Scholar', description: 'Complete 15 research projects.', icon: 'evil-book', condition: { kind: 'research', count: 15 } },
  // Endgame (M4)
  { id: 'floor500', name: 'Root and Branch', description: 'Reach floor 500.', icon: 'holy-oak', condition: { kind: 'bestFloor', floor: 500 } },
  { id: 'floor601', name: 'Godslayer', description: 'Defeat the Inverted God.', icon: 'all-seeing-eye', condition: { kind: 'bestFloor', floor: 601 } },
  { id: 'floor700', name: 'Down the Throat', description: 'Reach floor 700.', icon: 'vortex', condition: { kind: 'bestFloor', floor: 700 } },
  { id: 'gems25', name: 'Jeweller of the Dead', description: 'Find 25 gems.', icon: 'cut-diamond', condition: { kind: 'stat', stat: 'gemsFound', count: 25 } },
  { id: 'rift10', name: 'Rift Diver', description: 'Clear Rift depth 10.', icon: 'magic-portal', condition: { kind: 'riftBest', depth: 10 } },
  { id: 'rift30', name: 'Riftborn', description: 'Clear Rift depth 30.', icon: 'magic-portal', condition: { kind: 'riftBest', depth: 30 } },
  { id: 'curses3', name: 'Glutton for Punishment', description: 'Run with three curses at once.', icon: 'cursed-star', condition: { kind: 'curses', count: 3 } },
  { id: 'ascend1', name: 'The Second Death', description: 'Ascend to Lichdom.', icon: 'crowned-skull', condition: { kind: 'ascensions', count: 1 } },
  { id: 'ascend3', name: 'Death, Thrice Refused', description: 'Ascend three times.', icon: 'crowned-skull', condition: { kind: 'ascensions', count: 3 } },
  { id: 'dark25', name: 'Darker Still', description: 'Reach Dark Level 25.', icon: 'dread-skull', condition: { kind: 'darkLevel', level: 25 } },
];

export const FEATS_BY_ID: Readonly<Record<string, FeatDef>> = Object.fromEntries(FEATS.map((f) => [f.id, f]));
