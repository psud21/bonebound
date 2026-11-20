import type { IconName } from '../ui/icons.generated';

/** Features that exist in the design but not yet in the game, shown as sealed teasers. */
export const SEALED_FEATURES: readonly { name: string; hint: string; icon: IconName }[] = [
  { name: 'Mythic Relics', hint: 'Legendaries, but more so.', icon: 'sparkles' },
  { name: 'Seasons', hint: 'A fresh grave every few months, with new rules.', icon: 'sands-of-time' },
];
