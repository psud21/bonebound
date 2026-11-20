import type { IconName } from '../ui/icons.generated';

/** Features that exist in the design but not yet in the game, shown as sealed teasers. */
export const SEALED_FEATURES: readonly { name: string; hint: string; icon: IconName }[] = [
  { name: 'The Flesh Gardens', hint: 'Layer 5, where every enemy brings friends.', icon: 'tentacles-skull' },
  { name: 'Abyssal Rifts', hint: 'Ten-minute dives for the rarest relics.', icon: 'magic-portal' },
  { name: 'Gems and Sockets', hint: 'Cut the Abyss into your gear.', icon: 'rune-stone' },
  { name: 'Curses', hint: 'Make a run harder on purpose, for more reward.', icon: 'cursed-star' },
  { name: 'Lichdom', hint: 'The second death. The deeper reset.', icon: 'crowned-skull' },
];
