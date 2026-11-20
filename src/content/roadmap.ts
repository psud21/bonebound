import type { IconName } from '../ui/icons.generated';

/** Features that exist in the design but not yet in the game, shown as sealed teasers. */
export const SEALED_FEATURES: readonly { name: string; hint: string; icon: IconName }[] = [
  { name: 'Relics of the Deep', hint: 'Guardians will drop gear with random powers.', icon: 'locked-chest' },
  { name: 'Essence & Spells', hint: 'Bend the dead with Bone Armor and Corpse Explosion.', icon: 'magic-portal' },
  { name: 'Phylactery Rebirth', hint: 'Die, return stronger, and keep your Soul Shards.', icon: 'gothic-cross' },
  { name: 'The Forbidden Library', hint: 'Research that takes hours, and is worth it.', icon: 'evil-book' },
  { name: 'Schools of Necromancy', hint: 'Bone, Blood, Plague and Shadow.', icon: 'rune-stone' },
];
