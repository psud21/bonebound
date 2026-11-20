import { describe, expect, it } from 'vitest';
import { GameLoop } from '../src/engine/loop';
import { simulateOffline } from '../src/engine/offline';
import { createInitialState } from '../src/engine/state';
import { update } from '../src/systems/tick';
import { enterFloor } from '../src/systems/descent';

describe('GameLoop', () => {
  function makeLoop() {
    const dts: number[] = [];
    const gaps: number[] = [];
    const loop = new GameLoop({
      update: (dt) => dts.push(dt),
      onLongGap: (s) => gaps.push(s),
      tickMs: 50,
      longGapMs: 10_000,
    });
    return { loop, dts, gaps };
  }

  it('runs whole fixed ticks and carries the remainder', () => {
    const { loop, dts } = makeLoop();
    loop.advance(0);
    expect(loop.advance(120)).toBe(2); // 120ms → 2 ticks, 20ms carried
    expect(loop.advance(150)).toBe(1); // 20 + 30 = 50ms → 1 tick
    expect(dts).toEqual([0.05, 0.05, 0.05]);
  });

  it('ignores time going backwards', () => {
    const { loop } = makeLoop();
    loop.advance(1000);
    expect(loop.advance(500)).toBe(0);
  });

  it('hands long gaps to offline catch-up instead of ticking through them', () => {
    const { loop, dts, gaps } = makeLoop();
    loop.advance(0);
    expect(loop.advance(60_000)).toBe(0);
    expect(gaps).toEqual([60]);
    expect(dts).toEqual([]);
  });
});

describe('simulateOffline', () => {
  function armed() {
    const s = createInitialState(0, 1);
    s.army.minions.skeletonWarrior!.owned = 50;
    return s;
  }

  it('gives about the same Bones as playing live for the same time', () => {
    // Both farm floor 5 so live boss fights can't make the runs diverge.
    const farming = () => {
      const s = armed();
      s.descent.maxFloor = 5;
      enterFloor(s, 5);
      s.descent.autoAdvance = false;
      return s;
    };
    const live = farming();
    for (let i = 0; i < 20 * 300; i++) update(live, 0.05); // 5 minutes of live ticks
    const away = farming();
    simulateOffline(away, 300);
    const ratio = away.stats.lifetimeBones.div(live.stats.lifetimeBones).toNumber();
    expect(ratio).toBeGreaterThan(0.98);
    expect(ratio).toBeLessThan(1.02);
  });

  it('never pushes past the deepest floor already reached', () => {
    const s = armed();
    s.army.minions.ghoul!.owned = 1000;
    s.descent.maxFloor = 3;
    const summary = simulateOffline(s, 3600);
    expect(s.descent.floor).toBe(3);
    expect(summary.floorsGained).toBe(2);
    expect(summary.kills).toBeGreaterThan(0);
  });

  it('retreats from an unbeaten boss instead of fighting it unattended', () => {
    const s = armed();
    s.descent.maxFloor = 9;
    enterFloor(s, 10);
    simulateOffline(s, 600);
    expect(s.descent.floor).toBe(9);
    expect(s.descent.autoAdvance).toBe(false);
    expect(s.stats.bossesFailed).toBe(0); // a retreat, not a recorded loss
  });

  it('lets Warden-run graveworks produce while away', () => {
    const s = createInitialState(0, 1);
    s.crypt.graveworks.shallowGraves!.owned = 10;
    s.crypt.graveworks.shallowGraves!.warden = true;
    const summary = simulateOffline(s, 600);
    expect(summary.bonesGained.gt(0)).toBe(true);
  });

  it('respects the cap and stays fast for very long absences', () => {
    const s = armed();
    const t0 = performance.now();
    const summary = simulateOffline(s, 30 * 86400, { capSeconds: 8 * 3600 });
    expect(summary.simulatedSeconds).toBe(8 * 3600);
    expect(summary.awaySeconds).toBe(30 * 86400);
    expect(performance.now() - t0).toBeLessThan(1000);
  });

  it('does nothing for zero or negative time', () => {
    const s = armed();
    const summary = simulateOffline(s, -5);
    expect(summary.simulatedSeconds).toBe(0);
    expect(summary.bonesGained.eq(0)).toBe(true);
  });

  it('does not count offline time as play time', () => {
    const s = armed();
    simulateOffline(s, 600);
    expect(s.meta.playTimeSeconds).toBe(0);
  });
});
