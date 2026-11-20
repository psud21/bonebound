import { describe, expect, it } from 'vitest';
import { D } from '../src/engine/bignum';
import { createInitialState } from '../src/engine/state';
import { BALANCE } from '../src/content/balance';
import {
  buyGraveworks,
  cryptIncome,
  cycleSeconds,
  hireWarden,
  revenuePerCycle,
  startCycle,
  updateCrypt,
} from '../src/systems/crypt';
import {
  challengeBoss,
  enemyMaxHp,
  enterFloor,
  offlineFloorCap,
  skipFloors,
  updateBossTimer,
} from '../src/systems/descent';
import { catchSoul, spawnSoul, updateEvents } from '../src/systems/events';
import { bonesMultiplier, bossTimerSeconds, depthBonus } from '../src/systems/modifiers';
import { update } from '../src/systems/tick';

function withGraves(owned: number) {
  const s = createInitialState(0, 1);
  s.crypt.graveworks.shallowGraves!.owned = owned;
  return s;
}

describe('crypt', () => {
  it('a manual cycle runs once, pays out, then stops', () => {
    const s = withGraves(10);
    expect(startCycle(s, 'shallowGraves')).toBe(true);
    expect(startCycle(s, 'shallowGraves')).toBe(false); // already running
    const expected = revenuePerCycle(s, 'shallowGraves');
    updateCrypt(s, cycleSeconds(s, 'shallowGraves') * 3);
    expect(s.resources.bones.toNumber()).toBeCloseTo(expected.toNumber());
    expect(s.crypt.graveworks.shallowGraves!.running).toBe(false);
  });

  it('does nothing until started or automated', () => {
    const s = withGraves(10);
    updateCrypt(s, 100);
    expect(s.resources.bones.eq(0)).toBe(true);
    expect(cryptIncome(s).eq(0)).toBe(true);
  });

  it('a Warden keeps it running and pays every cycle, even in big steps', () => {
    const s = withGraves(10);
    s.resources.bones = D(1e6);
    expect(hireWarden(s, 'shallowGraves')).toBe(true);
    s.resources.bones = D(0);
    const cycle = cycleSeconds(s, 'shallowGraves');
    updateCrypt(s, cycle * 7.5);
    expect(s.resources.bones.toNumber()).toBeCloseTo(revenuePerCycle(s, 'shallowGraves').toNumber() * 7);
    expect(s.crypt.graveworks.shallowGraves!.progress).toBeCloseTo(0.5);
  });

  it('cannot hire a Warden without owning the graveworks', () => {
    const s = createInitialState(0, 1);
    s.resources.bones = D(1e9);
    expect(hireWarden(s, 'shallowGraves')).toBe(false);
  });

  it('milestones halve cycle time', () => {
    const s = withGraves(24);
    const slow = cycleSeconds(s, 'shallowGraves');
    s.crypt.graveworks.shallowGraves!.owned = 25;
    expect(cycleSeconds(s, 'shallowGraves')).toBeCloseTo(slow / 2);
  });

  it('output grows with depth', () => {
    const s = withGraves(1);
    const shallow = revenuePerCycle(s, 'shallowGraves').toNumber();
    s.descent.maxFloor = 50;
    expect(depthBonus(s)).toBeCloseTo(BALANCE.DEPTH_BONUS ** 49);
    expect(revenuePerCycle(s, 'shallowGraves').toNumber()).toBeCloseTo(shallow * depthBonus(s));
  });

  it('buying works like minions', () => {
    const s = createInitialState(0, 1);
    s.resources.bones = D(100);
    expect(buyGraveworks(s, 'shallowGraves', 1)).toBe(1);
    expect(s.crypt.graveworks.shallowGraves!.owned).toBe(1);
  });
});

describe('bosses', () => {
  function atBoss() {
    const s = createInitialState(0, 1);
    s.descent.maxFloor = 9;
    enterFloor(s, 10);
    return s;
  }

  it('entering a boss floor starts the timer', () => {
    const s = atBoss();
    expect(s.descent.bossTimeLeft).toBe(bossTimerSeconds(s));
  });

  it('running out of time pushes back a floor and stops advancing', () => {
    const s = atBoss();
    updateBossTimer(s, bossTimerSeconds(s) + 1);
    expect(s.descent.floor).toBe(9);
    expect(s.descent.autoAdvance).toBe(false);
    expect(s.stats.bossesFailed).toBe(1);
    expect(s.log[0]?.kind).toBe('boss');
  });

  it('while farming, clearing a floor does not advance', () => {
    const s = atBoss();
    updateBossTimer(s, 999);
    s.army.minions.abomination!.owned = 1; // far more than floor 9 needs
    for (let i = 0; i < 10; i++) update(s, 1);
    expect(s.descent.floor).toBe(9);
    expect(s.stats.totalKills).toBeGreaterThan(5);
  });

  it('challenging returns to the boss floor with a fresh timer', () => {
    const s = atBoss();
    updateBossTimer(s, 999);
    challengeBoss(s);
    expect(s.descent.floor).toBe(10);
    expect(s.descent.autoAdvance).toBe(true);
    expect(s.descent.bossTimeLeft).toBe(bossTimerSeconds(s));
  });

  it('offline never targets an unbeaten boss', () => {
    const s = atBoss();
    expect(offlineFloorCap(s)).toBe(9);
    s.descent.maxFloor = 15;
    expect(offlineFloorCap(s)).toBe(15);
  });

  it('upgrades extend the timer', () => {
    const s = createInitialState(0, 1);
    const base = bossTimerSeconds(s);
    s.upgrades.purchased.push('patienceOfTheDead');
    expect(bossTimerSeconds(s)).toBe(base + 10);
  });
});

describe('Wandering Souls', () => {
  function unlocked() {
    const s = createInitialState(0, 42);
    s.unlocks.souls = true;
    return s;
  }

  it('do not appear before they unlock', () => {
    const s = createInitialState(0, 1);
    updateEvents(s, 10_000, false);
    expect(s.events.soul).toBeNull();
  });

  it('appear after the cooldown, then fade if ignored', () => {
    const s = unlocked();
    updateEvents(s, s.events.soulCooldown + 0.1, false);
    expect(s.events.soul).not.toBeNull();
    updateEvents(s, BALANCE.SOUL_LIFETIME + 0.1, false);
    expect(s.events.soul).toBeNull();
    expect(s.events.soulCooldown).toBeGreaterThan(0);
  });

  it('never appear offline', () => {
    const s = unlocked();
    updateEvents(s, 10_000, true);
    expect(s.events.soul).toBeNull();
  });

  it('Soul Frenzy multiplies Bones and wears off', () => {
    const s = unlocked();
    spawnSoul(s);
    catchSoul(s, 'soulFrenzy');
    expect(bonesMultiplier(s)).toBe(7);
    updateEvents(s, 31, false);
    expect(bonesMultiplier(s)).toBe(1);
    expect(s.stats.soulsCaught).toBe(1);
  });

  it('Bone Shower gives Bones', () => {
    const s = unlocked();
    spawnSoul(s);
    catchSoul(s, 'boneShower');
    expect(s.resources.bones.gt(0)).toBe(true);
  });

  it('Grave Rush skips floors but stops before an unbeaten boss', () => {
    const s = unlocked();
    enterFloor(s, 3);
    expect(skipFloors(s, 5)).toBe(5);
    expect(s.descent.floor).toBe(8);
    expect(skipFloors(s, 5)).toBe(1); // 8 → 9, then floor 10's boss blocks
    expect(s.descent.floor).toBe(9);
    expect(s.resources.bones.gt(0)).toBe(true);
  });

  it('clicking with no soul does nothing', () => {
    const s = unlocked();
    expect(catchSoul(s)).toBeNull();
  });

  it('rewards are deterministic for a given RNG state', () => {
    const a = unlocked();
    const b = unlocked();
    spawnSoul(a);
    spawnSoul(b);
    expect(catchSoul(a)?.reward).toBe(catchSoul(b)?.reward);
  });
});
