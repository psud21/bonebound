import type { IconName } from '../ui/icons.generated';

/** Features that exist in the design but not yet in the game, shown as sealed teasers. */
export const SEALED_FEATURES: readonly { name: string; hint: string; icon: IconName }[] = [
  { name: 'The Drowned Catacombs', hint: 'Layer 2, where the enemies knit themselves back together.', icon: 'crypt-entrance' },
  { name: 'Blood, Plague & Shadow', hint: 'Three more schools of necromancy.', icon: 'rune-stone' },
  { name: 'The Forbidden Library', hint: 'Research that takes hours, and is worth it.', icon: 'evil-book' },
  { name: 'Covens', hint: 'Choose who you are each time you rise.', icon: 'pentagram-rose' },
  { name: 'Lichdom', hint: 'The second death. The deeper reset.', icon: 'crowned-skull' },
];
