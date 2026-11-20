import { describe, expect, it } from 'vitest';
import { D } from '../src/engine/bignum';
import { createInitialState } from '../src/engine/state';
import { BALANCE } from '../src/content/balance';
import { armyDps, buyMinion, minionDps, purchaseCost } from '../src/systems/army';
import { bonesPerKill, dealDamage, enemyMaxHp, floorBaseHp } from '../src/systems/descent';
import { minionMultiplier } from '../src/systems/modifiers';
import { clickDamage, siphon } from '../src/systems/siphon';
import { availableUpgrades, buyUpgrade } from '../src/systems/upgrades';
import { checkUnlocks } from '../src/systems/unlocks';
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

  it('doubles damage at each ownership milestone', () => {
    const s = createInitialState(0, 1);
    s.army.minions.skeletonWarrior!.owned = 9;
    expect(minionMultiplier(s, 'skeletonWarrior')).toBe(1);
    s.army.minions.skeletonWarrior!.owned = 10;
    expect(minionMultiplier(s, 'skeletonWarrior')).toBe(2);
    s.army.minions.skeletonWarrior!.owned = 25;
    expect(minionMultiplier(s, 'skeletonWarrior')).toBe(4);
  });

  it('archers deal double damage to bosses', () => {
    const s = createInitialState(0, 1);
    s.army.minions.skeletalArcher!.owned = 1;
    expect(minionDps(s, 'skeletalArcher', true).toNumber()).toBe(2 * minionDps(s, 'skeletalArcher').toNumber());
  });
});

describe('descent', () => {
  it('advances a floor after enough kills', () => {
    const s = createInitialState(0, 1);
    const result = dealDamage(s, enemyMaxHp(1).mul(BALANCE.KILLS_PER_FLOOR));
    expect(result.kills).toBe(BALANCE.KILLS_PER_FLOOR);
    expect(result.floorsCleared).toBe(1);
    expect(s.descent.floor).toBe(2);
    expect(s.resources.bones.toNumber()).toBeCloseTo(bonesPerKill(1).mul(BALANCE.KILLS_PER_FLOOR).toNumber());
  });

  it('carries overkill across floors in one hit', () => {
    const s = createInitialState(0, 1);
    dealDamage(s, D(5000));
    expect(s.descent.floor).toBeGreaterThan(5);
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

  it('pays less Bones per HP on deeper floors', () => {
    const shallow = bonesPerKill(1).div(enemyMaxHp(1)).toNumber();
    const deep = bonesPerKill(50).div(enemyMaxHp(50)).toNumber();
    expect(deep).toBeLessThan(shallow);
  });

  it('bosses have more HP and a single enemy', () => {
    expect(enemyMaxHp(10).div(floorBaseHp(10)).toNumber()).toBeCloseTo(BALANCE.BOSS_HP_MULT);
    const s = createInitialState(0, 1);
    s.descent.floor = 10;
    s.descent.maxFloor = 10;
    s.descent.enemyHp = enemyMaxHp(10);
    dealDamage(s, enemyMaxHp(10));
    expect(s.descent.floor).toBe(11);
    expect(s.stats.bossesDefeated).toBe(1);
  });
});

describe('siphon', () => {
  it('adds a percentage of army DPS with upgrades', () => {
    const s = createInitialState(0, 1);
    s.army.minions.ghoul!.owned = 10;
    const before = clickDamage(s).toNumber();
    s.upgrades.purchased.push('marrowSiphon');
    expect(clickDamage(s).toNumber()).toBeCloseTo(before + armyDps(s).toNumber() * 0.01);
  });
});

describe('upgrades', () => {
  it('appear only when their condition is met', () => {
    const s = createInitialState(0, 1);
    expect(availableUpgrades(s).map((u) => u.id)).not.toContain('sharpenedPhalanges');
    s.army.minions.skeletonWarrior!.owned = 5;
    expect(availableUpgrades(s).map((u) => u.id)).toContain('sharpenedPhalanges');
  });

  it('cost Bones, apply once, and multiply damage', () => {
    const s = createInitialState(0, 1);
    s.army.minions.skeletonWarrior!.owned = 5;
    s.resources.bones = D(1000);
    const before = armyDps(s).toNumber();
    expect(buyUpgrade(s, 'sharpenedPhalanges')).toBe(true);
    expect(buyUpgrade(s, 'sharpenedPhalanges')).toBe(false);
    expect(s.resources.bones.toNumber()).toBe(900);
    expect(armyDps(s).toNumber()).toBe(before * 2);
  });

  it('cannot be bought before unlocking', () => {
    const s = createInitialState(0, 1);
    s.resources.bones = D(1e12);
    expect(buyUpgrade(s, 'necroticPact')).toBe(false);
  });
});

describe('unlocks', () => {
  it('fire once each and write to the Chronicle', () => {
    const s = createInitialState(0, 1);
    expect(checkUnlocks(s)).toEqual(['start']);
    expect(s.log).toHaveLength(1);
    s.stats.lifetimeBones = D(50);
    expect(checkUnlocks(s)).toEqual(['crypt']);
    expect(checkUnlocks(s)).toEqual([]);
    expect(s.log).toHaveLength(2);
  });
});

describe('simulator', () => {
  it('is deterministic and reaches early milestones', () => {
    const a = runSimulation({ seconds: 600, seed: 3 });
    const b = runSimulation({ seconds: 600, seed: 3 });
    expect(a.milestones).toEqual(b.milestones);
    expect(a.milestones.map((m) => m.label)).toContain('Run 1: floor 10');
    expect(a.state.descent.maxFloor).toBeGreaterThan(10);
  });
});
