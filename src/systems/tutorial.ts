import type { GameState } from '../engine/state';
import { availableUpgrades } from './upgrades';
import { canRebirth } from './prestige';
import { libraryUnlocked } from './library';
import { corpsesUnlocked } from './elites';
import { magicUnlocked } from './magic';
import { onBossFloor } from './descent';

/**
 * First-time hints. Each appears once its `show` condition holds and disappears for good
 * once the player has done the thing (`done`) or dismissed it. One hint at a time, in order.
 */
export interface HintDef {
  id: string;
  title: string;
  text: string;
  show: (s: GameState) => boolean;
  done: (s: GameState) => boolean;
}

const owned = (s: GameState, id: string) => s.army.minions[id]?.owned ?? 0;

export const HINTS: readonly HintDef[] = [
  {
    id: 'siphon',
    title: 'Siphon',
    text: 'Click the enemy (or press Space) to Siphon: it deals damage and pulls Bones from the dead.',
    show: () => true,
    done: (s) => s.stats.totalClicks >= 5,
  },
  {
    id: 'firstMinion',
    title: 'Raise the dead',
    text: 'You can afford a Skeleton Warrior. Raise it in the Army panel: minions fight for you, even while you are away.',
    show: (s) => s.resources.bones.gte(10),
    done: (s) => owned(s, 'skeletonWarrior') > 0,
  },
  {
    id: 'upgrade',
    title: 'Upgrades',
    text: 'An upgrade is ready in the Army panel. Upgrades multiply damage, and they are usually the best deal on offer.',
    show: (s) => availableUpgrades(s).some((u) => s.resources.bones.gte(u.cost)),
    done: (s) => s.upgrades.purchased.length > 0,
  },
  {
    id: 'crypt',
    title: 'The Crypt',
    text: 'The Crypt is open (right-hand panel). Graveworks produce Bones in cycles. Buy some Shallow Graves.',
    show: (s) => s.unlocks.crypt === true,
    done: (s) => (s.crypt.graveworks.shallowGraves?.owned ?? 0) > 0,
  },
  {
    id: 'startCycle',
    title: 'Work the graves',
    text: 'Graveworks only run when you press Start, until you hire a Lich Warden to run them for you.',
    show: (s) => (s.crypt.graveworks.shallowGraves?.owned ?? 0) > 0,
    done: (s) => Object.values(s.crypt.graveworks).some((g) => g.running || g.warden),
  },
  {
    id: 'bulkBuy',
    title: 'Buy in bulk',
    text: 'Use ×10, ×100 or Max at the top of the Army panel. Every 10, 25, 50… of one minion doubles its damage.',
    show: (s) => s.unlocks.bulkBuy === true,
    done: (s) => s.settings.buyAmount !== 1,
  },
  {
    id: 'guardian',
    title: 'Guardians',
    text: 'A guardian waits here. Beat it before the timer runs out, or your army is pushed back a floor.',
    show: (s) => onBossFloor(s) && s.stats.bossesDefeated === 0,
    done: (s) => s.stats.bossesDefeated > 0,
  },
  {
    id: 'bossFail',
    title: 'Driven back',
    text: 'Your army is farming the floor below. Grow stronger, then press Challenge under the enemy.',
    show: (s) => !s.descent.autoAdvance,
    done: (s) => s.descent.autoAdvance && s.stats.bossesFailed > 0,
  },
  {
    id: 'soul',
    title: 'A Wandering Soul',
    text: 'A soul drifts across the screen. Click it before it fades for a burst of power.',
    show: (s) => s.events.soul !== null,
    done: (s) => s.stats.soulsCaught > 0,
  },
  {
    id: 'relic',
    title: 'Relics',
    text: 'You found a relic. Open the Relics tab and press Equip best.',
    show: (s) => s.loot.inventory.length > 0,
    done: (s) => Object.keys(s.loot.equipped).length > 0,
  },
  {
    id: 'spells',
    title: 'Spells',
    text: 'Spells sit under the enemy. Click one or press 1–9. They cost Essence, which refills on its own.',
    show: (s) => magicUnlocked(s),
    done: (s) => s.stats.spellsCast > 0,
  },
  {
    id: 'elites',
    title: 'Elites',
    text: 'Kills now leave Corpses. Spend them on an Elite at the bottom of the Army panel.',
    show: (s) => corpsesUnlocked(s) && s.resources.corpses >= 10,
    done: (s) => Object.values(s.army.elites).some((l) => l > 0),
  },
  {
    id: 'library',
    title: 'Research',
    text: 'Start a project in the Library tab. Research runs in real time, even offline, and survives death.',
    show: (s) => libraryUnlocked(s),
    done: (s) => s.library.active.length > 0 || s.library.completed.length > 0,
  },
  {
    id: 'rebirth',
    title: 'Rebirth',
    text: 'You can Rebirth from the Phylactery tab. You start over, but Soul Shards make every run faster. Push a little deeper first if you can.',
    show: (s) => canRebirth(s),
    done: (s) => s.prestige.rebirths > 0,
  },
  {
    id: 'pact',
    title: 'The Dark Pact',
    text: 'Spend Soul Shards in the Dark Pact (Phylactery tab). Head starts and automation make the next run fly.',
    show: (s) => s.prestige.shards > 0,
    done: (s) => s.prestige.pact.length > 0,
  },
];

/** Marks finished hints as seen. Returns the hint to show now, if any. */
export function updateTutorial(state: GameState): HintDef | null {
  if (!state.settings.hints) return null;
  const seen = state.tutorial.seen;
  let shown: HintDef | null = null;
  for (const h of HINTS) {
    if (seen.includes(h.id)) continue;
    if (h.done(state)) {
      seen.push(h.id);
      continue;
    }
    if (!shown && h.show(state)) shown = h;
  }
  return shown;
}

export function dismissHint(state: GameState, id: string): void {
  if (!state.tutorial.seen.includes(id)) state.tutorial.seen.push(id);
}
