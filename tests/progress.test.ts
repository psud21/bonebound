import { describe, expect, it } from 'vitest';
import { D } from '../src/engine/bignum';
import { createInitialState } from '../src/engine/state';
import { describeCondition, upcomingUnlocks, upcomingUpgrades } from '../src/systems/progress';
import { buildView } from '../src/ui/viewModel';
import { ICONS } from '../src/ui/icons.generated';
import { MINIONS } from '../src/content/minions';
import { GRAVEWORKS } from '../src/content/graveworks';
import { LAYERS } from '../src/content/layers';

describe('progress previews', () => {
  it('describes conditions with progress', () => {
    const s = createInitialState(0, 1);
    s.army.minions.skeletonWarrior!.owned = 5;
    const p = describeCondition(s, { kind: 'minionOwned', id: 'skeletonWarrior', count: 25 });
    expect(p.text).toBe('Own 25 Skeleton Warrior');
    expect(p.ratio).toBeCloseTo(0.2);
    expect(describeCondition(s, { kind: 'maxFloor', floor: 10 }).text).toBe('Reach floor 10');
  });

  it('lists locked upgrades closest first, excluding available ones', () => {
    const s = createInitialState(0, 1);
    s.army.minions.skeletonWarrior!.owned = 4; // 4/5 toward Sharpened Phalanges
    const list = upcomingUpgrades(s, 3);
    expect(list[0]?.def.id).toBe('sharpenedPhalanges');
    s.army.minions.skeletonWarrior!.owned = 5;
    expect(upcomingUpgrades(s, 10).map((u) => u.def.id)).not.toContain('sharpenedPhalanges');
  });

  it('lists upcoming story goals but never the start', () => {
    const s = createInitialState(0, 1);
    const ids = upcomingUnlocks(s, 20).map((u) => u.id);
    expect(ids).not.toContain('start');
    expect(ids).toContain('crypt');
  });

  it('previews the next two locked minions by name and hides the rest', () => {
    const s = createInitialState(0, 1);
    const statuses = buildView(s).minions.map((m) => m.status);
    expect(statuses).toEqual(['open', 'preview', 'preview', 'hidden', 'hidden', 'hidden', 'hidden', 'hidden', 'hidden', 'hidden']);
    s.stats.lifetimeBones = D(1e14);
    // Everything opens except the Dracolich, which waits for the Drowned King.
    const after = buildView(s).minions;
    expect(after.filter((m) => m.status === 'open')).toHaveLength(9);
    expect(after.find((m) => m.id === 'dracolich')?.status).not.toBe('open');
  });

  it('builds a depth track with ten guardians for Layer 1', () => {
    const s = createInitialState(0, 1);
    s.descent.maxFloor = 25;
    s.descent.floor = 25;
    const depth = buildView(s).depth;
    expect(depth.guardians).toHaveLength(10);
    expect(depth.guardians.filter((g) => g.defeated)).toHaveLength(2);
    expect(depth.nextGuardian.floor).toBe(30);
  });

  it('every content icon exists in the generated icon set', () => {
    const names = [
      ...MINIONS.map((m) => m.icon),
      ...GRAVEWORKS.map((g) => g.icon),
      ...LAYERS.flatMap((l) => [...l.enemies.map((e) => e.icon), ...Object.values(l.bosses).map((b) => b.icon)]),
    ];
    for (const n of names) expect(ICONS[n]).toBeTruthy();
  });
});
