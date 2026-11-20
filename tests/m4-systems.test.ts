import { describe, expect, it } from 'vitest';
import { D } from '../src/engine/bignum';
import { decodeSave, encodeSave } from '../src/engine/save';
import { createInitialState, type GameState, type Item } from '../src/engine/state';
import { gemKey, gemTierValue } from '../src/content/gems';
import { RIFT } from '../src/content/endgame';
import { purchaseCost, unitDps } from '../src/systems/army';
import { cursesUnlocked, toggleNextCurse } from '../src/systems/curses';
import { dealDamage, enemyMaxHp, enterFloor, killsForFloor } from '../src/systems/descent';
import { gearStat } from '../src/systems/gear';
import {
  addGem,
  combineAll,
  combineGems,
  gemCount,
  rollGemDrop,
  setEliteGem,
  socketGem,
  unsocketGem,
} from '../src/systems/gems';
import { buyLichPower, canAscend, dreadMultiplier, pendingDread } from '../src/systems/lichdom';
import { generateItem, salvageItem } from '../src/systems/loot';
import { spellKnown } from '../src/systems/magic';
import { allDamageMultiplier, bossTimerSeconds } from '../src/systems/modifiers';
import { ascend, hasPact, pendingShards, rebirth } from '../src/systems/prestige';
import { canOpenRift, closeRift, openRift, riftMasteryMultiplier, riftsUnlocked } from '../src/systems/rifts';
import { clickDamage } from '../src/systems/siphon';
import { update } from '../src/systems/tick';

function at(floor: number, seed = 11): GameState {
  const s = createInitialState(0, seed);
  s.descent.maxFloor = floor;
  s.prestige.bestFloor = floor;
  enterFloor(s, floor);
  return s;
}

describe('layers 5 to 7', () => {
  it('fills the Flesh Gardens with ten foes a floor, where Bone Mages splash', () => {
    expect(killsForFloor(451)).toBe(10);
    expect(killsForFloor(450)).toBe(1);
    expect(killsForFloor(351)).toBe(5);
    const gardens = at(451);
    const ratio = unitDps(gardens, 'boneMage').div(unitDps(gardens, 'ghoul')).toNumber();
    const glacierFree = at(199);
    const base = unitDps(glacierFree, 'boneMage').div(unitDps(glacierFree, 'ghoul')).toNumber();
    expect(ratio / base).toBeCloseTo(3);
  });

  it('consecrates Cathedral guardians against everyone but Wraiths', () => {
    const s = at(550);
    s.army.minions.ghoul!.owned = 1;
    s.army.minions.wraith!.owned = 1;
    const ratio = (id: string) => unitDps(s, id, true).div(unitDps(s, id, false)).toNumber();
    expect(ratio('ghoul')).toBeCloseTo(0.34);
    expect(ratio('wraith')).toBeCloseTo(1);
  });

  it('halves guardian timers in the Throat of the Void', () => {
    expect(bossTimerSeconds(at(650))).toBeCloseTo(bossTimerSeconds(at(150)) / 2);
  });
});

describe('gems', () => {
  it('combine three into one of the next tier', () => {
    const s = at(200);
    addGem(s, 'ruby:1', 7);
    expect(combineGems(s, 'ruby', 1)).toBe(true);
    expect(gemCount(s, 'ruby:1')).toBe(4);
    expect(gemCount(s, 'ruby:2')).toBe(1);
    addGem(s, 'ruby:2', 2);
    expect(combineAll(s)).toBe(2); // 4 → 1 ruby:2, then 3 ruby:2 → ruby:3
    expect(gemCount(s, 'ruby:3')).toBe(1);
  });

  it('socket into relics by rarity, add stats, and come back out unharmed', () => {
    const s = at(200);
    const rare = generateItem(s, 200, 'rare', 'staff');
    s.loot.equipped = { staff: rare };
    addGem(s, 'emerald:2', 2);
    const before = gearStat(s, 'bones');
    expect(socketGem(s, rare.id, 'emerald:2')).toBe(true);
    expect(socketGem(s, rare.id, 'emerald:2')).toBe(false); // rares have one socket
    expect(gearStat(s, 'bones') - before).toBeCloseTo(gemTierValue(2));
    expect(unsocketGem(s, rare.id, 0)).toBe(true);
    expect(gemCount(s, 'emerald:2')).toBe(2);
  });

  it('return to the bag when their relic is salvaged', () => {
    const s = at(200);
    const item = generateItem(s, 200, 'rare');
    s.loot.inventory.push(item);
    addGem(s, 'ruby:1');
    socketGem(s, item.id, 'ruby:1');
    salvageItem(s, item.id);
    expect(gemCount(s, 'ruby:1')).toBe(1);
  });

  it('count double when an Elite carries them, and survive Rebirth there', () => {
    const s = at(200);
    addGem(s, 'ruby:1');
    expect(setEliteGem(s, 'graveChampion', 'ruby:1')).toBe(true);
    expect(gearStat(s, 'minionDamage')).toBeCloseTo(gemTierValue(1) * 2);
    rebirth(s, 0);
    expect(s.army.eliteGems.graveChampion).toBe('ruby:1');
  });

  it('drop from guardians from floor 150', () => {
    const shallow = at(140);
    for (let i = 0; i < 50; i++) rollGemDrop(shallow, 140);
    expect(Object.keys(shallow.loot.gems)).toHaveLength(0);
    const deep = at(160);
    for (let i = 0; i < 50; i++) rollGemDrop(deep, 160);
    expect(deep.stats.gemsFound).toBeGreaterThan(10);
    expect(Object.keys(deep.loot.gems).every((k) => k.endsWith(':1'))).toBe(true);
  });
});

describe('abyssal rifts', () => {
  it('open with a key from a deep guardian’s first fall', () => {
    expect(riftsUnlocked(at(250))).toBe(false);
    const s = at(309);
    s.descent.maxFloor = 310;
    enterFloor(s, 310);
    dealDamage(s, enemyMaxHp(310));
    expect(s.rift.keys).toBe(1);
    expect(canOpenRift(s)).toBe(true);
  });

  it('take the army’s damage while open, then pay out by depth', () => {
    const s = at(320);
    s.rift.keys = 1;
    s.army.minions.dracolich!.owned = 50;
    expect(openRift(s)).toBe(true);
    expect(s.rift.keys).toBe(0);
    const floor = s.descent.floor;
    const kills = s.stats.totalKills;
    for (let t = 0; t < 30; t++) update(s, 1);
    expect(s.descent.floor).toBe(floor);
    expect(s.stats.totalKills).toBe(kills);
    expect(s.rift.depth).toBeGreaterThan(1);
    const dust = s.loot.dust;
    for (let t = 0; t < RIFT.SECONDS; t++) update(s, 1);
    expect(s.rift.active).toBe(false);
    expect(s.rift.best).toBeGreaterThan(0);
    expect(s.loot.dust).toBeGreaterThan(dust);
    expect(riftMasteryMultiplier(s)).toBeCloseTo(1 + 0.03 * s.rift.best);
  });

  it('close cleanly on Rebirth', () => {
    const s = at(320);
    s.rift.keys = 1;
    openRift(s);
    rebirth(s, 0);
    expect(s.rift.active).toBe(false);
    expect(closeRift(s)).toBeNull();
  });
});

describe('curses', () => {
  it('are chosen for the next run and pay more Soul Shards', () => {
    const s = at(150);
    expect(cursesUnlocked(s)).toBe(false);
    s.prestige.rebirths = 5;
    expect(toggleNextCurse(s, 'costlyDead')).toBe(true);
    expect(toggleNextCurse(s, 'stillHands')).toBe(true);
    expect(s.prestige.curses).toEqual([]);
    const plain = pendingShards(s);
    rebirth(s, 0);
    expect(s.prestige.curses).toEqual(['costlyDead', 'stillHands']);
    expect(clickDamage(s).toNumber()).toBe(0);
    const clean = createInitialState(0, 1);
    expect(purchaseCost(s, 'skeletonWarrior', 1).div(purchaseCost(clean, 'skeletonWarrior', 1)).toNumber()).toBeCloseTo(2);
    s.descent.maxFloor = 150;
    expect(pendingShards(s)).toBe(Math.floor(plain * 1.4));
  });
});

describe('lichdom', () => {
  it('needs floor 401 and enough Soul Shards, then trades them for Dread', () => {
    const s = at(380);
    s.prestige.shardsEarned = 1600;
    s.prestige.shards = 200;
    s.prestige.pact = ['graveMemory'];
    expect(canAscend(s)).toBe(false);
    s.prestige.bestFloor = 401;
    expect(pendingDread(s)).toBe(2);
    s.library.completed.push('boneLedgers');
    s.feats.push('floor10');
    const item = generateItem(s, 300, 'legendary');
    s.loot.inventory.push(item);
    expect(ascend(s, 0)).toBe(2);
    expect(s.prestige.shards).toBe(0);
    expect(s.prestige.shardsEarned).toBe(0);
    expect(s.prestige.pact).toEqual([]);
    expect(s.lich.dread).toBe(2);
    expect(s.library.completed).toContain('boneLedgers');
    expect(s.feats).toContain('floor10');
    expect(s.loot.inventory.some((i) => i.id === item.id)).toBe(true);
    expect(dreadMultiplier(s)).toBeCloseTo(2);
  });

  it('powers grant free Pact nodes and deeper starts', () => {
    const s = at(10);
    s.lich.dread = 10;
    expect(buyLichPower(s, 'boundRites')).toBe(false); // needs The Undying Host
    expect(buyLichPower(s, 'undyingHost')).toBe(true);
    expect(buyLichPower(s, 'boundRites')).toBe(true);
    expect(hasPact(s, 'autoRaise')).toBe(true);
    expect(buyLichPower(s, 'abyssalStride')).toBe(true);
    s.descent.maxFloor = 100;
    rebirth(s, 0);
    expect(s.descent.floor).toBe(201);
  });

  it('earns Dark Levels only as a Lich, from new floors', () => {
    const mortal = at(100);
    enterFloor(mortal, 101);
    expect(mortal.lich.darkXp).toBe(0);
    const lich = at(100);
    lich.lich.ascensions = 1;
    const before = allDamageMultiplier(lich);
    for (let f = 101; f <= 400; f++) enterFloor(lich, f);
    expect(lich.lich.darkLevel).toBeGreaterThan(0);
    expect(allDamageMultiplier(lich)).toBeGreaterThan(before);
    const xp = lich.lich.darkXp;
    enterFloor(lich, 300); // not new
    expect(lich.lich.darkXp).toBe(xp);
  });
});

describe('army of the dead', () => {
  it('needs every school at level 25', () => {
    const s = at(50);
    s.unlocks.essence = true;
    s.prestige.rebirths = 2;
    s.prestige.bestFloor = 120;
    s.magic.schools.bone = { level: 30, xp: 0 };
    expect(spellKnown(s, 'armyOfTheDead')).toBe(false);
    for (const id of ['blood', 'plague', 'shadow'] as const) s.magic.schools[id] = { level: 25, xp: 0 };
    expect(spellKnown(s, 'armyOfTheDead')).toBe(true);
  });
});

describe('saves in M4', () => {
  it('round-trip gems, Rifts, Curses and Lichdom', () => {
    const s = at(320);
    addGem(s, gemKey('diamond', 3), 2);
    const item = generateItem(s, 300, 'legendary');
    s.loot.inventory.push(item);
    addGem(s, 'ruby:1');
    socketGem(s, item.id, 'ruby:1');
    s.army.eliteGems = { ...s.army.eliteGems, hierophant: 'emerald:1' };
    s.rift = { keys: 2, active: true, timeLeft: 100, depth: 4, enemyHp: D(5), best: 7 };
    s.prestige.curses = ['impatience'];
    s.prestige.nextCurses = ['barrenCrypt'];
    s.lich = { dread: 3, dreadEarned: 5, ascensions: 1, powers: ['undyingHost'], darkLevel: 4, darkXp: 12 };
    const back = decodeSave(encodeSave(s));
    expect(back.loot.gems).toEqual({ 'diamond:3': 2 });
    expect(back.loot.inventory[0]!.gems).toEqual(['ruby:1']);
    expect(back.army.eliteGems.hierophant).toBe('emerald:1');
    expect(back.rift).toMatchObject({ keys: 2, active: true, depth: 4, best: 7 });
    expect(back.prestige.curses).toEqual(['impatience']);
    expect(back.lich).toEqual(s.lich);
  });

  it('cleans bad values and gives old items an empty gem list', () => {
    const s = at(200);
    const old = generateItem(s, 200, 'rare');
    delete (old as Partial<Item>).gems;
    s.loot.inventory.push(old);
    const raw = JSON.parse(atob(encodeSave(s).slice(4)));
    raw.version = 4;
    delete raw.rift;
    delete raw.lich;
    raw.loot.gems = { 'ruby:1': 2, 'opal:1': 3, 'ruby:99': 1 };
    raw.prestige.curses = ['impatience', 'nope'];
    raw.army.eliteGems = { graveChampion: 'bogus' };
    const back = decodeSave('BB1:' + btoa(JSON.stringify(raw)));
    expect(back.loot.inventory[0]!.gems).toEqual([]);
    expect(back.loot.gems).toEqual({ 'ruby:1': 2 });
    expect(back.prestige.curses).toEqual(['impatience']);
    expect(back.army.eliteGems.graveChampion).toBeNull();
    expect(back.rift.active).toBe(false);
    expect(back.lich.ascensions).toBe(0);
  });
});
