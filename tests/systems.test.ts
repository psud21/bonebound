import { describe, expect, it } from 'vitest';
import { D } from '../src/engine/bignum';
import { createInitialState } from '../src/engine/state';
import { BALANCE } from '../src/content/balance';
import { armyDps, buyMinion, purchaseCost } from '../src/systems/army';
import { bonesPerKill, dealDamage, floorMaxHp } from '../src/systems/descent';
import { siphon } from '../src/systems/siphon';
import { runSimulation } from '../sim/simulate';

describe('army', () => {
  it('buys one minion and deducts its cost', () => {
    const s = createInitialState(0, 1);
    s.resources.bones = D(25);
    expect(buyMinion(s, 'skeletonWarrior', 1)).toBe(1);
    expect(s.resources.bones.toNumber()).toBeCloseTo(15);
    expect(armyDps(s).toNumber()).toBe(1);
  });

  it('refuses a fixed bulk purchase it cannot fully afford', () => {
    const s = createInitialState(0, 1);
    s.resources.bones = D(50);
    expect(buyMinion(s, 'skeletonWarrior', 10)).toBe(0);
    expect(s.resources.bones.eq(50)).toBe(true);
  });

  it('"max" buys as many as possible', () => {
    const s = createInitialState(0, 1);
    s.resources.bones = D(1000);
    const bought = buyMinion(s, 'skeletonWarrior', 'max');
    expect(bought).toBeGreaterThan(10);
    expect(s.resources.bones.lt(purchaseCost(s, 'skeletonWarrior', 1))).toBe(true);
  });
});

describe('descent', () => {
  it('advances a floor after enough kills', () => {
    const s = createInitialState(0, 1);
    const result = dealDamage(s, floorMaxHp(1).mul(BALANCE.KILLS_PER_FLOOR));
    expect(result.kills).toBe(BALANCE.KILLS_PER_FLOOR);
    expect(result.floorsCleared).toBe(1);
    expect(s.descent.floor).toBe(2);
    expect(s.resources.bones.toNumber()).toBeCloseTo(bonesPerKill(1).mul(BALANCE.KILLS_PER_FLOOR).toNumber());
  });

  it('carries overkill across many floors in one hit', () => {
    const s = createInitialState(0, 1);
    dealDamage(s, D(1e6));
    expect(s.descent.floor).toBeGreaterThan(20);
    expect(s.descent.maxFloor).toBe(s.descent.floor);
  });

  it('farms the capped floor instead of advancing', () => {
    const s = createInitialState(0, 1);
    const result = dealDamage(s, D(1e9), { floorCap: 1 });
    expect(s.descent.floor).toBe(1);
    expect(result.kills).toBeGreaterThan(1000);
  });

  it('partial damage reduces enemy HP', () => {
    const s = createInitialState(0, 1);
    const before = s.descent.enemyHp;
    siphon(s);
    expect(s.descent.enemyHp.lt(before)).toBe(true);
    expect(s.stats.totalClicks).toBe(1);
  });
});

describe('simulator', () => {
  it('is deterministic and reaches early milestones', () => {
    const a = runSimulation({ seconds: 600, seed: 3 });
    const b = runSimulation({ seconds: 600, seed: 3 });
    expect(a.milestones).toEqual(b.milestones);
    expect(a.milestones.map((m) => m.label)).toContain('First Skeleton Warrior');
    expect(a.state.descent.maxFloor).toBeGreaterThan(10);
  });
});
